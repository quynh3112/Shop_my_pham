import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useCallback, useState } from "react";
import type { Point } from "../utils/faceZones";

// Phải khớp phiên bản @mediapipe/tasks-vision trong package.json
const MEDIAPIPE_VERSION = "1.1.0";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Tải model 1 lần cho cả trang (khoảng vài MB), các lần sau dùng lại
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

const getLandmarker = () => {
  landmarkerPromise ??= FilesetResolver.forVisionTasks(WASM_URL)
    .then((fileset) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        numFaces: 2,
      }),
    )
    .catch((error) => {
      landmarkerPromise = null; // lỗi mạng thì lần sau thử tải lại
      throw error;
    });
  return landmarkerPromise;
};

export type FaceDetection =
  | { status: "ok"; landmarks: Point[] }
  | { status: "no-face" | "multiple-faces" }
  | { status: "unavailable" };

/**
 * Tìm các điểm mốc khuôn mặt ngay trên trình duyệt (ảnh không gửi đi đâu).
 * Dùng để tô vùng da và chặn sớm ảnh không có / có nhiều khuôn mặt trước khi gọi AI.
 */
export default function useFaceLandmarker() {
  const [detecting, setDetecting] = useState(false);

  const detect = useCallback(async (image: HTMLImageElement): Promise<FaceDetection> => {
    setDetecting(true);
    try {
      const landmarker = await getLandmarker();
      const result = landmarker.detect(image);
      if (result.faceLandmarks.length === 0) return { status: "no-face" };
      if (result.faceLandmarks.length > 1) return { status: "multiple-faces" };
      return { status: "ok", landmarks: result.faceLandmarks[0].map(({ x, y }) => ({ x, y })) };
    } catch {
      // Máy yếu / chặn CDN: vẫn cho phân tích, chỉ là không tô vùng trên ảnh thật
      return { status: "unavailable" };
    } finally {
      setDetecting(false);
    }
  }, []);

  return { detect, detecting, preload: getLandmarker };
}
