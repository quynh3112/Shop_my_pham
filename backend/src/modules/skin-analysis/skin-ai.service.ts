import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  FACE_ZONES,
  FACE_ZONE_CODES,
  SEVERITIES,
  SKIN_CONCERNS,
  SKIN_CONCERN_CODES,
  SKIN_TYPES,
  SKIN_TYPE_CODES,
  type SkinType,
} from './skin.constants';
import type { SkinFinding } from './entity/skin-analysis.entity';

const REQUEST_TIMEOUT_MS = 45_000;
const MODEL_COOLDOWN_MS = 2 * 60_000;
const DEFAULT_FALLBACK_MODELS = 'gemini-3.1-flash-lite,gemini-flash-lite-latest';
const MAX_FINDINGS = 14;
const MAX_TIPS = 5;

export interface SkinAiResult {
  skinType: SkinType;
  summary: string;
  findings: SkinFinding[];
  tips: string[];
  model: string;
}

// Gemini bắt buộc trả JSON đúng khuôn này
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isFace: { type: 'boolean', description: 'Ảnh có khuôn mặt người nhìn thẳng, đủ rõ để đánh giá da không' },
    qualityIssue: {
      type: 'string',
      description: 'Nếu không đánh giá được: lý do ngắn gọn bằng tiếng Việt (thiếu sáng, mờ, đeo khẩu trang...). Ngược lại để chuỗi rỗng.',
    },
    skinType: { type: 'string', enum: SKIN_TYPE_CODES },
    summary: { type: 'string', description: 'Nhận xét tổng quan 2-3 câu tiếng Việt' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: FACE_ZONE_CODES },
          concern: { type: 'string', enum: SKIN_CONCERN_CODES },
          severity: { type: 'string', enum: [...SEVERITIES] },
          note: { type: 'string', description: 'Mô tả ngắn điều thấy được ở vùng này, tiếng Việt' },
        },
        required: ['zone', 'concern', 'severity', 'note'],
      },
    },
    tips: {
      type: 'array',
      items: { type: 'string' },
      description: 'Tối đa 5 gợi ý chăm sóc da ngắn gọn, tiếng Việt',
    },
  },
  required: ['isFace', 'qualityIssue', 'skinType', 'summary', 'findings', 'tips'],
};

const describe = (labels: Record<string, string>) =>
  Object.entries(labels)
    .map(([code, label]) => `${code} = ${label}`)
    .join('; ');

const SYSTEM_PROMPT = [
  'Bạn là chuyên viên tư vấn chăm sóc da của cửa hàng mỹ phẩm Lunelle. Bạn nhận 1 ảnh chụp khuôn mặt và đánh giá tình trạng da nhìn thấy được.',
  'Chỉ mô tả những gì quan sát được trên ảnh, không chẩn đoán bệnh, không kê thuốc. Nếu không chắc thì dùng mức "mild" hoặc bỏ qua.',
  'Nếu ảnh không có khuôn mặt người, quá mờ / tối, bị che phần lớn mặt hoặc có filter làm mịn da: đặt isFace=false và ghi qualityIssue, findings để rỗng.',
  `Loại da (skinType): ${describe(SKIN_TYPES)}.`,
  `Vấn đề da (concern): ${describe(SKIN_CONCERNS)}.`,
  `Vùng mặt (zone) — trái / phải tính theo NGƯỜI XEM ẢNH, không phải theo người trong ảnh: ${describe(FACE_ZONES)}.`,
  'Mức độ (severity): mild = nhẹ, moderate = vừa, severe = nhiều / rõ.',
  `Mỗi finding là 1 vấn đề ở 1 vùng; cùng vấn đề ở nhiều vùng thì tách thành nhiều finding. Tối đa ${MAX_FINDINGS} finding.`,
  'Toàn bộ chữ trả về (summary, note, tips, qualityIssue) viết bằng tiếng Việt, thân thiện, ngắn gọn.',
].join('\n');

/** Gọi Gemini phân tích ảnh da; tự chuyển model dự phòng khi model chính lỗi / quá tải */
@Injectable()
export class SkinAiService {
  private readonly logger = new Logger(SkinAiService.name);
  private readonly client: GoogleGenAI | null;
  private readonly models: string[];
  private readonly cooldownUntil = new Map<string, number>();

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.client = apiKey
      ? new GoogleGenAI({
          apiKey,
          httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: { attempts: 1 } },
        })
      : null;
    const fallbacks = config
      .get<string>('GEMINI_FALLBACK_MODELS', DEFAULT_FALLBACK_MODELS)
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    this.models = [
      ...new Set([
        config.get<string>('SKIN_ANALYSIS_MODEL') || config.get<string>('GEMINI_MODEL', 'gemini-flash-latest'),
        ...fallbacks,
      ]),
    ];
  }

  async analyze(image: Buffer, mimeType: string): Promise<SkinAiResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('Chức năng phân tích da chưa được cấu hình (thiếu GEMINI_API_KEY).');
    }

    const now = Date.now();
    const available = this.models.filter((m) => (this.cooldownUntil.get(m) ?? 0) <= now);
    const candidates = available.length ? available : this.models;

    for (const [index, model] of candidates.entries()) {
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType, data: image.toString('base64') } },
                { text: 'Phân tích tình trạng da trong ảnh này theo đúng định dạng JSON đã quy định.' },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        });
        this.cooldownUntil.delete(model);
        return { ...this.parse(response.text), model };
      } catch (error) {
        // Ảnh không hợp lệ là lỗi của dữ liệu, đổi model cũng không khác
        if (error instanceof HttpException) throw error;
        this.cooldownUntil.set(model, Date.now() + MODEL_COOLDOWN_MS);
        const reason = (error as { status?: number }).status ?? (error as Error).message;
        if (index === candidates.length - 1) {
          this.logger.error(`Phân tích da thất bại trên mọi model (${reason})`);
          throw new ServiceUnavailableException('Hệ thống phân tích da đang bận, vui lòng thử lại sau ít phút.');
        }
        this.logger.warn(`Gemini model ${model} lỗi (${reason}), chuyển sang ${candidates[index + 1]}`);
      }
    }
    throw new ServiceUnavailableException('Hệ thống phân tích da đang bận, vui lòng thử lại sau ít phút.');
  }

  /** Đọc JSON Gemini trả về, bỏ các giá trị ngoài bộ nhãn */
  private parse(text: string | undefined): Omit<SkinAiResult, 'model'> {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text ?? '');
    } catch {
      throw new Error('Gemini trả về JSON không hợp lệ');
    }

    if (raw.isFace !== true) {
      const issue = typeof raw.qualityIssue === 'string' && raw.qualityIssue.trim();
      throw new UnprocessableEntityException(
        issue || 'Không nhận diện được khuôn mặt rõ ràng. Vui lòng chụp lại ảnh chính diện, đủ sáng, không filter.',
      );
    }

    const skinType = SKIN_TYPE_CODES.includes(raw.skinType as SkinType) ? (raw.skinType as SkinType) : 'normal';
    const findings = (Array.isArray(raw.findings) ? raw.findings : [])
      .filter(
        (f): f is SkinFinding =>
          typeof f === 'object' &&
          f !== null &&
          FACE_ZONE_CODES.includes(f.zone) &&
          SKIN_CONCERN_CODES.includes(f.concern) &&
          SEVERITIES.includes(f.severity),
      )
      .map((f) => ({ zone: f.zone, concern: f.concern, severity: f.severity, note: String(f.note ?? '').slice(0, 300) }))
      .slice(0, MAX_FINDINGS);
    const tips = (Array.isArray(raw.tips) ? raw.tips : [])
      .filter((tip): tip is string => typeof tip === 'string' && tip.trim().length > 0)
      .map((tip) => tip.trim().slice(0, 300))
      .slice(0, MAX_TIPS);

    return {
      skinType,
      summary: String(raw.summary ?? '').trim().slice(0, 1000) || 'Đã phân tích xong ảnh của bạn.',
      findings,
      tips,
    };
  }
}
