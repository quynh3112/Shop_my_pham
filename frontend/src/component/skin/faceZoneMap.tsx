import { useMemo } from "react";
import type { FaceZone, SkinFinding } from "../../types/skin";
import { SCHEMATIC_ZONES, zonePolygons, type Point } from "../../utils/faceZones";
import { FACE_ZONE_LABEL, SEVERITY, worstSeverityByZone } from "../../utils/skin";

interface Props {
  findings: SkinFinding[];
  /** Ảnh đã phân tích + điểm mốc khuôn mặt; không có thì vẽ khuôn mặt minh hoạ */
  imageUrl?: string;
  aspectRatio?: number; // width / height của ảnh
  landmarks?: Point[];
  activeZone?: FaceZone | null;
  onSelectZone?: (zone: FaceZone | null) => void;
}

const toPath = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(" ");

/** Tô màu các vùng da có vấn đề lên ảnh khuôn mặt (màu theo mức độ nặng nhất của vùng) */
export default function FaceZoneMap({ findings, imageUrl, aspectRatio = 1, landmarks, activeZone, onSelectZone }: Props) {
  const severityByZone = useMemo(() => worstSeverityByZone(findings), [findings]);
  const realZones = imageUrl && landmarks ? zonePolygons(landmarks) : null;
  const zones = realZones ?? SCHEMATIC_ZONES;
  const ratio = realZones ? aspectRatio : 0.8;

  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-[#fbf1ef]"
      style={{ aspectRatio: String(ratio) }}
    >
      {realZones ? (
        <img src={imageUrl} alt="Ảnh khuôn mặt đã phân tích" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        // Khuôn mặt minh hoạ khi xem lại lịch sử (ảnh gốc không được lưu)
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="0.5" cy="0.5" rx="0.36" ry="0.44" fill="#fde7e1" stroke="#e8caca" strokeWidth="0.006" />
          <path d="M0.27 0.38 Q0.34 0.34 0.41 0.38 M0.59 0.38 Q0.66 0.34 0.73 0.38" stroke="#b58c8c" strokeWidth="0.008" fill="none" />
          <path d="M0.42 0.72 Q0.5 0.76 0.58 0.72" stroke="#d27f84" strokeWidth="0.01" fill="none" strokeLinecap="round" />
        </svg>
      )}

      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {(Object.entries(zones) as [FaceZone, Point[]][]).map(([zone, points]) => {
          const severity = severityByZone.get(zone);
          if (!severity || points.length < 3) return null;
          const active = activeZone === zone;
          return (
            <polygon
              key={zone}
              points={toPath(points)}
              fill={SEVERITY[severity].fill}
              stroke={active ? "#ffffff" : "rgba(255,255,255,0.7)"}
              strokeWidth={active ? 0.008 : 0.004}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={`cursor-pointer transition-opacity ${activeZone && !active ? "opacity-40" : "opacity-100"}`}
              onClick={() => onSelectZone?.(active ? null : zone)}
            >
              <title>
                {FACE_ZONE_LABEL[zone]} · {SEVERITY[severity].label}
              </title>
            </polygon>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 flex gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[11px] text-[#5b4747] backdrop-blur">
        {Object.values(SEVERITY).map((level) => (
          <span key={level.label} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: level.fill.replace(/[\d.]+\)$/, "0.9)") }} />
            {level.label}
          </span>
        ))}
      </div>
    </div>
  );
}
