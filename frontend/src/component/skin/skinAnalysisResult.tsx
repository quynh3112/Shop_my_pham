import { BulbOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import { useState } from "react";
import type { FaceZone, SkinAnalysisDetail } from "../../types/skin";
import type { Point } from "../../utils/faceZones";
import { formatDateTime } from "../../utils/order";
import { SKIN_TYPE_LABEL } from "../../utils/skin";
import CheckoutSection from "../order/checkoutSection";
import FaceZoneMap from "./faceZoneMap";
import SkinFindingList from "./skinFindingList";
import SkinRecommendations from "./skinRecommendations";

interface Props {
  analysis: SkinAnalysisDetail;
  /** Có khi vừa phân tích xong (ảnh còn trong trình duyệt); xem lại lịch sử thì không có */
  image?: { url: string; aspectRatio: number; landmarks?: Point[] };
}

/** Toàn bộ kết quả 1 lần phân tích: tổng quan, bản đồ vùng da, gợi ý chăm sóc, sản phẩm */
export default function SkinAnalysisResult({ analysis, image }: Props) {
  const [activeZone, setActiveZone] = useState<FaceZone | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <CheckoutSection
        title="Kết quả phân tích"
        extra={<span className="text-xs text-[#987979]">{formatDateTime(analysis.createdAt)}</span>}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#987979]">Loại da:</span>
          <Tag color="#e16463" className="!m-0 !rounded-full !px-3 !py-0.5 !text-sm">
            {SKIN_TYPE_LABEL[analysis.skinType]}
          </Tag>
        </div>
        <p className="mt-3 leading-7 text-[#5b4747]">{analysis.summary}</p>
      </CheckoutSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <CheckoutSection title="Vùng da cần chú ý">
          <FaceZoneMap
            findings={analysis.findings}
            imageUrl={image?.url}
            aspectRatio={image?.aspectRatio}
            landmarks={image?.landmarks}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
          />
          {!image?.landmarks && (
            <p className="mt-3 text-center text-xs text-[#987979]">
              {image
                ? "Không xác định được vị trí khuôn mặt nên hiển thị trên hình minh hoạ."
                : "Lần phân tích này không lưu ảnh, vùng da hiển thị trên hình minh hoạ."}
            </p>
          )}
        </CheckoutSection>
        <CheckoutSection title={`Chi tiết theo vùng (${analysis.findings.length})`}>
          <SkinFindingList findings={analysis.findings} activeZone={activeZone} onSelectZone={setActiveZone} />
        </CheckoutSection>
      </div>

      {analysis.tips.length > 0 && (
        <CheckoutSection title="Gợi ý chăm sóc">
          <ul className="flex flex-col gap-2">
            {analysis.tips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-6 text-[#5b4747]">
                <BulbOutlined className="mt-1 text-[#e16463]" /> {tip}
              </li>
            ))}
          </ul>
        </CheckoutSection>
      )}

      <CheckoutSection title="Sản phẩm phù hợp với bạn">
        <SkinRecommendations
          recommendations={analysis.recommendations}
          concerns={analysis.concerns}
          skinType={analysis.skinType}
        />
      </CheckoutSection>

      <p className="flex gap-2 text-xs leading-5 text-[#987979]">
        <InfoCircleOutlined className="mt-0.5" />
        Kết quả do AI đánh giá từ ảnh chụp, chỉ mang tính tham khảo và có thể bị ảnh hưởng bởi ánh sáng, camera hoặc lớp
        trang điểm. Không thay thế chẩn đoán của bác sĩ da liễu — nếu da bị kích ứng, viêm nặng hoặc kéo dài, hãy đi khám.
      </p>
    </div>
  );
}
