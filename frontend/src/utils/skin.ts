import type { FaceZone, Severity, SkinConcern, SkinFinding, SkinType } from "../types/skin";

// Bản sao nhãn ở backend: src/modules/skin-analysis/skin.constants.ts — đổi mã ở đó thì sửa cả ở đây
export const SKIN_TYPE_LABEL: Record<SkinType, string> = {
  oily: "Da dầu",
  dry: "Da khô",
  combination: "Da hỗn hợp",
  normal: "Da thường",
  sensitive: "Da nhạy cảm",
};

export const SKIN_CONCERN_LABEL: Record<SkinConcern, string> = {
  acne: "Mụn viêm / mụn mủ",
  blackheads: "Mụn đầu đen / mụn ẩn",
  dark_spots: "Thâm / nám / đốm nâu",
  large_pores: "Lỗ chân lông to",
  oiliness: "Bóng dầu",
  dryness: "Khô / bong tróc",
  redness: "Mẩn đỏ / kích ứng",
  dullness: "Xỉn màu / không đều màu",
  wrinkles: "Nếp nhăn / lão hoá",
  dark_circles: "Quầng thâm mắt",
};

export const FACE_ZONE_LABEL: Record<FaceZone, string> = {
  forehead: "Trán",
  nose: "Mũi",
  cheek_left: "Má (bên trái ảnh)",
  cheek_right: "Má (bên phải ảnh)",
  chin: "Cằm",
  under_eye_left: "Dưới mắt (bên trái ảnh)",
  under_eye_right: "Dưới mắt (bên phải ảnh)",
};

export const SEVERITY: Record<Severity, { label: string; color: string; fill: string; rank: number }> = {
  mild: { label: "Nhẹ", color: "gold", fill: "rgba(250, 173, 20, 0.35)", rank: 1 },
  moderate: { label: "Vừa", color: "orange", fill: "rgba(250, 112, 40, 0.42)", rank: 2 },
  severe: { label: "Rõ", color: "red", fill: "rgba(225, 60, 70, 0.5)", rank: 3 },
};

export const SKIN_TYPE_OPTIONS = Object.entries(SKIN_TYPE_LABEL).map(([value, label]) => ({ value, label }));
export const SKIN_CONCERN_OPTIONS = Object.entries(SKIN_CONCERN_LABEL).map(([value, label]) => ({ value, label }));

/** Mức nặng nhất của từng vùng (để tô màu vùng trên ảnh) */
export const worstSeverityByZone = (findings: SkinFinding[]) => {
  const result = new Map<FaceZone, Severity>();
  for (const finding of findings) {
    const current = result.get(finding.zone);
    if (!current || SEVERITY[finding.severity].rank > SEVERITY[current].rank) result.set(finding.zone, finding.severity);
  }
  return result;
};

/** Gom các vấn đề theo vùng, vùng nặng hơn lên trước */
export const groupFindingsByZone = (findings: SkinFinding[]) => {
  const groups = new Map<FaceZone, SkinFinding[]>();
  for (const finding of findings) groups.set(finding.zone, [...(groups.get(finding.zone) ?? []), finding]);
  const worst = worstSeverityByZone(findings);
  return [...groups.entries()].sort(
    ([a], [b]) => SEVERITY[worst.get(b)!].rank - SEVERITY[worst.get(a)!].rank,
  );
};
