import type { ProductItem } from "./product";

export type SkinType = "oily" | "dry" | "combination" | "normal" | "sensitive";
export type SkinConcern =
  | "acne"
  | "blackheads"
  | "dark_spots"
  | "large_pores"
  | "oiliness"
  | "dryness"
  | "redness"
  | "dullness"
  | "wrinkles"
  | "dark_circles";
export type FaceZone =
  | "forehead"
  | "nose"
  | "cheek_left"
  | "cheek_right"
  | "chin"
  | "under_eye_left"
  | "under_eye_right";
export type Severity = "mild" | "moderate" | "severe";

export interface SkinFinding {
  zone: FaceZone;
  concern: SkinConcern;
  severity: Severity;
  note: string;
}

export interface SkinRecommendation {
  productId: number;
  score: number;
  matchedConcerns: SkinConcern[];
  matchesSkinType: boolean;
  product: ProductItem;
}

export interface SkinAnalysisDetail {
  id: number;
  skinType: SkinType;
  summary: string;
  findings: SkinFinding[];
  concerns: SkinConcern[];
  tips: string[];
  recommendations: SkinRecommendation[];
  createdAt: string;
  /** Có lưu ảnh khuôn mặt không (ảnh lấy qua API riêng, cần đăng nhập) */
  hasImage: boolean;
  imageWidth: number | null;
  imageHeight: number | null;
  landmarks: { x: number; y: number }[] | null;
}

export type SkinAnalysisSummary = Pick<
  SkinAnalysisDetail,
  "id" | "skinType" | "summary" | "concerns" | "createdAt" | "hasImage"
>;

export interface AnalyzeSkinOptions {
  /** Lưu ảnh vào lịch sử (thư mục riêng tư ở server) */
  saveImage: boolean;
  landmarks?: { x: number; y: number }[];
  width: number;
  height: number;
}

export interface SkinAnalysisList {
  items: SkinAnalysisSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
