import { api } from "../config/api";
import type { AnalyzeSkinOptions, SkinAnalysisDetail, SkinAnalysisList } from "../types/skin";

const endpoint = "skin-analysis";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Gemini có thể mất vài chục giây
const ANALYZE_TIMEOUT_MS = 90_000;

export const analyzeSkin = async ({
  image,
  options,
}: {
  image: Blob;
  options: AnalyzeSkinOptions;
}): Promise<SkinAnalysisDetail> => {
  const formData = new FormData();
  formData.append("image", image, "face.jpg");
  formData.append("saveImage", String(options.saveImage));
  formData.append("imageWidth", String(options.width));
  formData.append("imageHeight", String(options.height));
  // Điểm mốc chỉ cần khi lưu ảnh (để tô lại vùng da lúc xem lịch sử)
  if (options.saveImage && options.landmarks) formData.append("landmarks", JSON.stringify(options.landmarks));
  const res = await api.post(endpoint, formData, { headers: authHeaders(), timeout: ANALYZE_TIMEOUT_MS });
  return res.data;
};

export const listMySkinAnalyses = async (page = 1, limit = 10): Promise<SkinAnalysisList> => {
  const res = await api.get(endpoint, { headers: authHeaders(), params: { page, limit } });
  return res.data;
};

export const getMySkinAnalysis = async (id: number): Promise<SkinAnalysisDetail> => {
  const res = await api.get(`${endpoint}/${id}`, { headers: authHeaders() });
  return res.data;
};

// Ảnh riêng tư: phải gửi kèm token nên tải về dạng Blob thay vì dùng thẳng <img src>
export const getMySkinAnalysisImage = async (id: number): Promise<Blob> => {
  const res = await api.get(`${endpoint}/${id}/image`, { headers: authHeaders(), responseType: "blob" });
  return res.data;
};

export const deleteMySkinAnalysis = async (id: number) => {
  const res = await api.delete(`${endpoint}/${id}`, { headers: authHeaders() });
  return res.data;
};
