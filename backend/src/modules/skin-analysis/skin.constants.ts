/**
 * Bộ nhãn dùng chung cho phân tích da và gắn nhãn sản phẩm.
 * Frontend có bản sao nhãn tiếng Việt ở src/utils/skin.ts — thêm / đổi mã ở đây thì sửa cả bên đó.
 */

export const SKIN_TYPES = {
  oily: 'Da dầu',
  dry: 'Da khô',
  combination: 'Da hỗn hợp',
  normal: 'Da thường',
  sensitive: 'Da nhạy cảm',
} as const;
export type SkinType = keyof typeof SKIN_TYPES;

export const SKIN_CONCERNS = {
  acne: 'Mụn viêm / mụn mủ',
  blackheads: 'Mụn đầu đen / mụn ẩn',
  dark_spots: 'Thâm / nám / đốm nâu',
  large_pores: 'Lỗ chân lông to',
  oiliness: 'Bóng dầu',
  dryness: 'Khô / bong tróc',
  redness: 'Mẩn đỏ / kích ứng',
  dullness: 'Xỉn màu / không đều màu',
  wrinkles: 'Nếp nhăn / lão hoá',
  dark_circles: 'Quầng thâm mắt',
} as const;
export type SkinConcern = keyof typeof SKIN_CONCERNS;

// Trái / phải tính theo người xem ảnh (khớp với vùng tô trên ảnh ở frontend)
export const FACE_ZONES = {
  forehead: 'Trán',
  nose: 'Mũi',
  cheek_left: 'Má bên trái ảnh',
  cheek_right: 'Má bên phải ảnh',
  chin: 'Cằm',
  under_eye_left: 'Dưới mắt bên trái ảnh',
  under_eye_right: 'Dưới mắt bên phải ảnh',
} as const;
export type FaceZone = keyof typeof FACE_ZONES;

export const SEVERITIES = ['mild', 'moderate', 'severe'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SKIN_TYPE_CODES = Object.keys(SKIN_TYPES) as SkinType[];
export const SKIN_CONCERN_CODES = Object.keys(SKIN_CONCERNS) as SkinConcern[];
export const FACE_ZONE_CODES = Object.keys(FACE_ZONES) as FaceZone[];

const pick = <T extends string>(allowed: readonly T[]) => (values: unknown): T[] =>
  Array.isArray(values)
    ? [...new Set(values.filter((v): v is T => typeof v === 'string' && allowed.includes(v as T)))]
    : [];

/** Lọc bỏ mã không hợp lệ / trùng (dùng khi lưu nhãn sản phẩm) */
export const pickSkinTypes = pick(SKIN_TYPE_CODES);
export const pickSkinConcerns = pick(SKIN_CONCERN_CODES);
