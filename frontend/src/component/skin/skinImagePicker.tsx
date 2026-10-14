import { CameraOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Modal, Upload, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { MB } from "../../utils/file";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 15 * MB; // ảnh gốc từ điện thoại; sẽ được nén lại trước khi gửi

interface Props {
  disabled?: boolean;
  onPick: (image: Blob) => void;
}

/** Tải ảnh lên hoặc chụp bằng camera trước */
export default function SkinImagePicker({ disabled, onPick }: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Upload.Dragger
        accept={ACCEPT.join(",")}
        showUploadList={false}
        disabled={disabled}
        beforeUpload={(file) => {
          if (!ACCEPT.includes(file.type)) message.error("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
          else if (file.size > MAX_SIZE) message.error("Ảnh quá lớn (tối đa 15MB).");
          else onPick(file);
          return false;
        }}
        className="!rounded-3xl !border-[#e8caca] !bg-[#fffafa] hover:!border-[#e16463]"
      >
        <p className="text-4xl text-[#e88f98]">
          <InboxOutlined />
        </p>
        <p className="mt-2 font-medium text-[#2d2020]">Bấm hoặc kéo ảnh khuôn mặt vào đây</p>
        <p className="text-xs text-[#987979]">JPG, PNG, WEBP · ảnh chính diện, đủ sáng, mặt mộc, không filter</p>
      </Upload.Dragger>
      <Button block size="large" icon={<CameraOutlined />} disabled={disabled} onClick={() => setCameraOpen(true)}>
        Chụp bằng camera
      </Button>
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(image) => {
          setCameraOpen(false);
          onPick(image);
        }}
      />
    </div>
  );
}

function CameraModal({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (image: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((media) => {
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch(() => setError("Không mở được camera. Hãy cho phép trình duyệt dùng camera hoặc tải ảnh lên."));
    // Đóng modal là tắt camera
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Lật lại để ảnh chụp giống ảnh người dùng thấy trong khung xem trước (kiểu gương)
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.92);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Chụp ảnh khuôn mặt"
      okText="Chụp"
      cancelText="Huỷ"
      onOk={capture}
      okButtonProps={{ disabled: Boolean(error) }}
      destroyOnHidden
      centered
    >
      {error ? (
        <p className="py-10 text-center text-[#c64f52]">{error}</p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full -scale-x-100" />
          {/* Khung gợi ý đặt mặt vào giữa */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[72%] aspect-[3/4] rounded-[50%] border-2 border-dashed border-white/70" />
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-[#987979]">Đặt khuôn mặt vào khung, nhìn thẳng, ánh sáng đều.</p>
    </Modal>
  );
}
