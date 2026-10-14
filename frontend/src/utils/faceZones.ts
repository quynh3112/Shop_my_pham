import type { FaceZone } from "../types/skin";

export interface Point {
  x: number;
  y: number;
}

/**
 * Các điểm mốc (MediaPipe Face Mesh, 478 điểm) bao quanh từng vùng mặt.
 * "left / right" theo người xem ảnh: má bên trái ảnh là má phải của người trong ảnh.
 * Vùng được vẽ bằng bao lồi (convex hull) của các điểm nên chỉ cần chọn điểm nằm ở rìa vùng.
 */
export const ZONE_LANDMARKS: Record<FaceZone, number[]> = {
  forehead: [10, 109, 67, 103, 54, 21, 68, 104, 69, 108, 151, 337, 299, 333, 298, 251, 284, 332, 297, 338, 9],
  nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 327, 64, 294, 48, 278, 129, 358, 49, 279, 114, 343],
  cheek_left: [116, 123, 147, 187, 207, 206, 205, 36, 142, 100, 101, 50, 117],
  cheek_right: [345, 352, 376, 411, 427, 426, 425, 266, 371, 329, 330, 280, 346],
  chin: [152, 148, 176, 149, 150, 136, 377, 400, 378, 379, 365, 18, 200, 199, 175, 171, 396, 208, 428, 83, 313, 201, 421],
  under_eye_left: [226, 31, 228, 229, 230, 231, 232, 233, 244, 128, 121, 120, 119, 118, 117, 111],
  under_eye_right: [446, 261, 448, 449, 450, 451, 452, 453, 464, 357, 350, 349, 348, 347, 346, 340],
};

/** Bao lồi (Andrew's monotone chain) để có đa giác gọn cho mỗi vùng */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Đa giác (toạ độ chuẩn hoá 0..1) cho từng vùng từ các điểm mốc khuôn mặt */
export function zonePolygons(landmarks: Point[]): Record<FaceZone, Point[]> {
  return Object.fromEntries(
    Object.entries(ZONE_LANDMARKS).map(([zone, indices]) => [
      zone,
      convexHull(indices.map((index) => landmarks[index]).filter(Boolean)),
    ]),
  ) as Record<FaceZone, Point[]>;
}

/** Vùng vẽ sẵn trên khuôn mặt minh hoạ (khi xem lại lịch sử, không còn ảnh gốc) — toạ độ 0..1 */
export const SCHEMATIC_ZONES: Record<FaceZone, Point[]> = {
  forehead: [{ x: 0.3, y: 0.14 }, { x: 0.7, y: 0.14 }, { x: 0.74, y: 0.3 }, { x: 0.26, y: 0.3 }],
  nose: [{ x: 0.45, y: 0.4 }, { x: 0.55, y: 0.4 }, { x: 0.6, y: 0.6 }, { x: 0.4, y: 0.6 }],
  cheek_left: [{ x: 0.2, y: 0.48 }, { x: 0.38, y: 0.5 }, { x: 0.37, y: 0.66 }, { x: 0.24, y: 0.68 }],
  cheek_right: [{ x: 0.62, y: 0.5 }, { x: 0.8, y: 0.48 }, { x: 0.76, y: 0.68 }, { x: 0.63, y: 0.66 }],
  chin: [{ x: 0.4, y: 0.78 }, { x: 0.6, y: 0.78 }, { x: 0.57, y: 0.9 }, { x: 0.43, y: 0.9 }],
  under_eye_left: [{ x: 0.25, y: 0.42 }, { x: 0.42, y: 0.42 }, { x: 0.4, y: 0.47 }, { x: 0.27, y: 0.47 }],
  under_eye_right: [{ x: 0.58, y: 0.42 }, { x: 0.75, y: 0.42 }, { x: 0.73, y: 0.47 }, { x: 0.6, y: 0.47 }],
};
