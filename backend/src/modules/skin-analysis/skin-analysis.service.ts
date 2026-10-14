import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { Product } from '../product/entity/product.entity';
import { SkinAnalysis, type FacePoint, type SkinFinding, type SkinRecommendation } from './entity/skin-analysis.entity';
import { SkinImageStorage } from './skin-image.storage';
import { SkinAiService } from './skin-ai.service';
import type { Severity, SkinConcern, SkinType } from './skin.constants';

const SEVERITY_WEIGHT: Record<Severity, number> = { mild: 1, moderate: 2, severe: 3 };
const MAX_RECOMMENDATIONS = 12;

// Nhận diện ảnh theo vài byte đầu file, không tin mimetype trình duyệt gửi lên
function detectImageType(buffer: Buffer): string | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

const IMAGE_EXTENSION: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
// MediaPipe Face Mesh: 468 điểm (478 khi có mống mắt)
const MIN_LANDMARKS = 468;
const MAX_LANDMARKS = 478;

export interface AnalyzeOptions {
  saveImage?: boolean;
  /** JSON string các điểm mốc khuôn mặt [{x,y}] toạ độ 0..1, do trình duyệt gửi lên */
  landmarks?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/** Kiểm tra điểm mốc gửi lên, làm tròn để lưu gọn; sai định dạng thì bỏ qua (không báo lỗi) */
function parseLandmarks(raw?: string): FacePoint[] | null {
  if (!raw || raw.length > 60_000) return null;
  try {
    const points: unknown = JSON.parse(raw);
    if (!Array.isArray(points) || points.length < MIN_LANDMARKS || points.length > MAX_LANDMARKS) return null;
    const valid = points.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        p.x > -0.5 && p.x < 1.5 &&
        p.y > -0.5 && p.y < 1.5,
    );
    if (!valid) return null;
    return points.map((p: FacePoint) => ({ x: Math.round(p.x * 1e4) / 1e4, y: Math.round(p.y * 1e4) / 1e4 }));
  } catch {
    return null;
  }
}

const toDimension = (value?: number) =>
  value !== undefined && Number.isInteger(value) && value > 0 && value <= 10_000 ? value : null;

const productStock = (product: Product) =>
  (product.variants ?? []).reduce((sum, variant) => sum + (variant.stock ?? 0), 0);

@Injectable()
export class SkinAnalysisService {
  private readonly dailyLimit: number;

  constructor(
    @InjectRepository(SkinAnalysis) private readonly analysisRepo: Repository<SkinAnalysis>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly skinAi: SkinAiService,
    private readonly imageStorage: SkinImageStorage,
    config: ConfigService,
  ) {
    this.dailyLimit = Math.max(1, Number(config.get('SKIN_ANALYSIS_DAILY_LIMIT', 10)) || 10);
  }

  /** Phân tích ảnh -> gợi ý sản phẩm -> lưu lịch sử (ảnh chỉ lưu khi khách đồng ý, ở thư mục riêng) */
  async analyze(userId: number, file?: { buffer: Buffer }, options: AnalyzeOptions = {}) {
    if (!file?.buffer?.length) throw new BadRequestException('Vui lòng chọn ảnh khuôn mặt.');
    const mimeType = detectImageType(file.buffer);
    if (!mimeType) throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');

    // Mỗi lần phân tích tốn phí gọi AI -> giới hạn theo ngày
    const usedToday = await this.analysisRepo.count({
      where: { userId, createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)) },
    });
    if (usedToday >= this.dailyLimit) {
      throw new HttpException(
        `Bạn đã dùng hết ${this.dailyLimit} lượt phân tích trong 24 giờ qua. Vui lòng quay lại sau.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.skinAi.analyze(file.buffer, mimeType);
    const recommendations = await this.recommend(result.skinType, result.findings);

    // Chỉ ghi ảnh ra đĩa SAU khi AI phân tích thành công, tránh lưu ảnh của lượt lỗi
    const imagePath = options.saveImage
      ? await this.imageStorage.save(userId, file.buffer, IMAGE_EXTENSION[mimeType])
      : null;

    try {
      const saved = await this.analysisRepo.save(
        this.analysisRepo.create({
          userId,
          skinType: result.skinType,
          summary: result.summary,
          findings: result.findings,
          concerns: [...new Set(result.findings.map((finding) => finding.concern))],
          tips: result.tips,
          recommendations,
          model: result.model,
          imagePath,
          imageWidth: imagePath ? toDimension(options.imageWidth) : null,
          imageHeight: imagePath ? toDimension(options.imageHeight) : null,
          landmarks: imagePath ? parseLandmarks(options.landmarks) : null,
        }),
      );
      return this.toDetail(saved);
    } catch (error) {
      await this.imageStorage.remove(imagePath);
      throw error;
    }
  }

  async listMine(userId: number, page = 1, limit = 10) {
    const take = Math.min(50, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.analysisRepo.findAndCount({
      where: { userId },
      select: ['id', 'skinType', 'summary', 'concerns', 'createdAt', 'imagePath'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      items: items.map(({ imagePath, ...item }) => ({ ...item, hasImage: Boolean(imagePath) })),
      pagination: { page: Math.max(1, page), limit: take, total, totalPages: Math.max(1, Math.ceil(total / take)) },
    };
  }

  async getMine(userId: number, id: number) {
    const analysis = await this.analysisRepo.findOne({ where: { id, userId } });
    if (!analysis) throw new NotFoundException('Không tìm thấy kết quả phân tích này.');
    return this.toDetail(analysis);
  }

  /** Đường dẫn file ảnh của kết quả — chỉ chủ tài khoản lấy được */
  async getImagePath(userId: number, id: number) {
    const analysis = await this.analysisRepo.findOne({ where: { id, userId }, select: ['id', 'imagePath'] });
    if (!analysis?.imagePath) throw new NotFoundException('Kết quả này không lưu ảnh.');
    return this.imageStorage.resolve(analysis.imagePath);
  }

  /** Xoá kết quả kèm ảnh đã lưu */
  async removeMine(userId: number, id: number) {
    const analysis = await this.analysisRepo.findOne({ where: { id, userId }, select: ['id', 'imagePath'] });
    if (!analysis) throw new NotFoundException('Không tìm thấy kết quả phân tích này.');
    await this.analysisRepo.delete({ id, userId });
    await this.imageStorage.remove(analysis.imagePath);
    return { deleted: true, id };
  }

  /**
   * Chấm điểm sản phẩm đang bán + còn hàng theo nhãn:
   * mỗi vấn đề trùng khớp cộng theo mức độ nặng nhất của vấn đề đó, hợp loại da cộng thêm.
   */
  private async recommend(skinType: SkinType, findings: SkinFinding[]): Promise<SkinRecommendation[]> {
    const concernWeight = new Map<SkinConcern, number>();
    for (const finding of findings) {
      concernWeight.set(
        finding.concern,
        Math.max(concernWeight.get(finding.concern) ?? 0, SEVERITY_WEIGHT[finding.severity]),
      );
    }

    const products = await this.productRepo.find({
      where: { isActive: true },
      relations: ['variants'],
      select: { id: true, skinTypes: true, concerns: true, variants: { id: true, stock: true } },
    });

    return products
      .filter((product) => productStock(product) > 0)
      .map((product) => {
        const matchedConcerns = (product.concerns ?? []).filter((concern): concern is SkinConcern =>
          concernWeight.has(concern as SkinConcern),
        );
        const matchesSkinType = (product.skinTypes ?? []).includes(skinType);
        const score =
          matchedConcerns.reduce((sum, concern) => sum + 2 * (concernWeight.get(concern) ?? 0), 0) +
          (matchesSkinType ? 2 : 0);
        return { productId: product.id, score, matchedConcerns, matchesSkinType };
      })
      // Phải khớp ít nhất 1 vấn đề da, hoặc (khi da không có vấn đề gì) khớp loại da
      .filter((rec) => rec.matchedConcerns.length > 0 || (concernWeight.size === 0 && rec.matchesSkinType))
      .sort((a, b) => b.score - a.score || a.productId - b.productId)
      .slice(0, MAX_RECOMMENDATIONS);
  }

  /** Kèm thông tin sản phẩm hiện tại (giá, ảnh, tồn kho có thể đã đổi từ lúc phân tích) */
  private async toDetail(analysis: SkinAnalysis) {
    const ids = analysis.recommendations.map((rec) => rec.productId);
    const products = ids.length
      ? await this.productRepo.find({
          where: { id: In(ids), isActive: true },
          relations: ['category', 'images', 'variants'],
          order: { images: { sortOrder: 'ASC' } },
        })
      : [];
    const byId = new Map(products.map((product) => [product.id, product]));

    // Không trả đường dẫn file ra ngoài, chỉ báo có ảnh hay không
    const { imagePath, ...rest } = analysis;
    return {
      ...rest,
      hasImage: Boolean(imagePath),
      recommendations: analysis.recommendations
        .map((rec) => {
          const product = byId.get(rec.productId);
          if (!product) return null; // sản phẩm đã ẩn / xoá
          const { variants, ...rest } = product;
          return { ...rec, product: { ...rest, stock: productStock(product) } };
        })
        .filter((rec) => rec !== null),
    };
  }
}
