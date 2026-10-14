import { ExperimentOutlined, LoadingOutlined, ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Skeleton, Spin, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AccountPageLayout from "../component/accountPageLayout";
import CheckoutSection from "../component/order/checkoutSection";
import SkinAnalysisResult from "../component/skin/skinAnalysisResult";
import SkinHistoryList from "../component/skin/skinHistoryList";
import SkinImagePicker from "../component/skin/skinImagePicker";
import useFaceLandmarker, { type FaceDetection } from "../hooks/useFaceLandmarker";
import useRequireLogin from "../hooks/useRequireLogin";
import { useAnalyzeSkin, useSkinAnalysisDetail, useSkinAnalysisImage } from "../hooks/useSkinAnalysis";
import type { SkinAnalysisDetail } from "../types/skin";
import { getApiErrorMessage } from "../utils/error";
import { prepareImage, type PreparedImage } from "../utils/image";

const DETECTION_MESSAGE: Partial<Record<FaceDetection["status"], string>> = {
  "no-face": "Không tìm thấy khuôn mặt trong ảnh. Hãy chụp chính diện, đủ sáng và không che mặt.",
  "multiple-faces": "Ảnh có nhiều khuôn mặt. Vui lòng dùng ảnh chỉ có khuôn mặt của bạn.",
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

/** Phân tích ảnh mới */
function NewAnalysis() {
  const [messageApi, contextHolder] = message.useMessage();
  const { detect, detecting, preload } = useFaceLandmarker();
  const { analyze, analyzing } = useAnalyzeSkin();
  const { handleAuthError } = useRequireLogin();

  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [detection, setDetection] = useState<FaceDetection | null>(null);
  const [consent, setConsent] = useState(false);
  const [saveImage, setSaveImage] = useState(true);
  const [result, setResult] = useState<SkinAnalysisDetail | null>(null);
  const [preparing, setPreparing] = useState(false);
  const urlRef = useRef<string | null>(null);

  // Tải sẵn model nhận diện khuôn mặt trong lúc người dùng chọn ảnh
  useEffect(() => {
    void preload().catch(() => undefined);
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const reset = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPrepared(null);
    setDetection(null);
    setResult(null);
  };

  const handlePick = async (source: Blob) => {
    reset();
    setPreparing(true);
    try {
      const image = await prepareImage(source);
      urlRef.current = image.url;
      setPrepared(image);
      setDetection(await detect(await loadImage(image.url)));
    } catch {
      messageApi.error("Không đọc được ảnh này, vui lòng chọn ảnh khác.");
    } finally {
      setPreparing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prepared) return;
    try {
      setResult(
        await analyze({
          image: prepared.blob,
          options: {
            saveImage,
            landmarks: detection?.status === "ok" ? detection.landmarks : undefined,
            width: prepared.width,
            height: prepared.height,
          },
        }),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (!handleAuthError(error)) messageApi.error(getApiErrorMessage(error, "Không phân tích được ảnh, vui lòng thử lại."));
    }
  };

  if (result && prepared) {
    return (
      <div className="flex flex-col gap-4">
        {contextHolder}
        <div className="flex justify-end">
          <Button icon={<ReloadOutlined />} onClick={reset}>
            Phân tích ảnh khác
          </Button>
        </div>
        <SkinAnalysisResult
          analysis={result}
          image={{
            url: prepared.url,
            aspectRatio: prepared.width / prepared.height,
            landmarks: detection?.status === "ok" ? detection.landmarks : undefined,
          }}
        />
      </div>
    );
  }

  const blockedMessage = detection ? DETECTION_MESSAGE[detection.status] : undefined;
  const canAnalyze = Boolean(prepared) && !blockedMessage && consent && !detecting && !preparing;

  return (
    <CheckoutSection title="Ảnh khuôn mặt của bạn">
      {contextHolder}
      <div className="grid gap-6 md:grid-cols-2">
        <SkinImagePicker disabled={analyzing || preparing} onPick={(image) => void handlePick(image)} />

        <div className="flex flex-col gap-3">
          <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-[#fbf1ef]">
            {prepared ? (
              <img src={prepared.url} alt="Ảnh đã chọn" className="max-h-96 w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-[#987979]">
                <ExperimentOutlined className="text-4xl text-[#e88f98]" />
                Ảnh xem trước sẽ hiện ở đây
              </div>
            )}
            {(preparing || detecting || analyzing) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
                <Spin indicator={<LoadingOutlined className="!text-3xl !text-[#e16463]" spin />} />
                <span className="text-sm text-[#5b4747]">
                  {analyzing ? "AI đang phân tích da của bạn, có thể mất 10–30 giây..." : "Đang kiểm tra khuôn mặt..."}
                </span>
              </div>
            )}
          </div>

          {blockedMessage && <Alert type="warning" showIcon message={blockedMessage} />}
          {detection?.status === "unavailable" && (
            <Alert
              type="info"
              showIcon
              message="Không tải được bộ nhận diện khuôn mặt, kết quả sẽ hiển thị trên hình minh hoạ."
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[#fff4f2] p-4">
        <Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)}>
          <span className="text-sm leading-6 text-[#5b4747]">
            Tôi đồng ý gửi ảnh này tới dịch vụ AI (Google Gemini) để phân tích da.
          </span>
        </Checkbox>
        <Checkbox checked={saveImage} onChange={(event) => setSaveImage(event.target.checked)}>
          <span className="text-sm leading-6 text-[#5b4747]">
            Lưu ảnh vào lịch sử để xem lại sau. Ảnh được lưu riêng tư, <b>chỉ bạn xem được</b>, và bị xoá khi bạn xoá
            kết quả. Bỏ chọn nếu chỉ muốn lưu kết quả phân tích.
          </span>
        </Checkbox>
      </div>

      <Button
        type="primary"
        size="large"
        block
        icon={<SafetyCertificateOutlined />}
        loading={analyzing}
        disabled={!canAnalyze}
        onClick={() => void handleAnalyze()}
        className="!mt-4"
      >
        Phân tích da
      </Button>
    </CheckoutSection>
  );
}

/** Xem lại 1 kết quả trong lịch sử */
function SavedAnalysis({ id }: { id: number }) {
  const { analysis, loading, error } = useSkinAnalysisDetail(id);
  const { url: imageUrl, loading: imageLoading } = useSkinAnalysisImage(id, Boolean(analysis?.hasImage));
  if (loading || (analysis?.hasImage && imageLoading)) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (error || !analysis) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tìm thấy kết quả phân tích"
        description={getApiErrorMessage(error, "Kết quả không tồn tại hoặc đã bị xoá.")}
        action={
          <Link to="/skin-analysis">
            <Button size="small">Phân tích mới</Button>
          </Link>
        }
      />
    );
  }
  const image =
    imageUrl && analysis.imageWidth && analysis.imageHeight
      ? {
          url: imageUrl,
          aspectRatio: analysis.imageWidth / analysis.imageHeight,
          landmarks: analysis.landmarks ?? undefined,
        }
      : undefined;
  return <SkinAnalysisResult analysis={analysis} image={image} />;
}

export default function SkinAnalysisPage() {
  const { id } = useParams();
  const analysisId = Number(id) || undefined;

  return (
    <AccountPageLayout
      eyebrow="Soi da cùng AI"
      title="Phân tích da"
      description="Tải lên ảnh khuôn mặt, AI sẽ chỉ ra vùng da cần chú ý và gợi ý sản phẩm phù hợp trong shop."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">{analysisId ? <SavedAnalysis key={analysisId} id={analysisId} /> : <NewAnalysis />}</div>
        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-20">
          {analysisId && (
            <Link to="/skin-analysis">
              <Button type="primary" block icon={<ExperimentOutlined />}>
                Phân tích ảnh mới
              </Button>
            </Link>
          )}
          <CheckoutSection title="Lịch sử phân tích">
            <SkinHistoryList activeId={analysisId} />
          </CheckoutSection>
        </aside>
      </div>
    </AccountPageLayout>
  );
}
