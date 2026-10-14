import { CheckCircleOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import type { FaceZone, SkinFinding } from "../../types/skin";
import { FACE_ZONE_LABEL, SEVERITY, SKIN_CONCERN_LABEL, groupFindingsByZone } from "../../utils/skin";

interface Props {
  findings: SkinFinding[];
  activeZone?: FaceZone | null;
  onSelectZone?: (zone: FaceZone | null) => void;
}

/** Danh sách vấn đề da theo từng vùng mặt; bấm để làm nổi vùng tương ứng trên ảnh */
export default function SkinFindingList({ findings, activeZone, onSelectZone }: Props) {
  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[#f0f9f0] p-4 text-sm text-[#3d7a3d]">
        <CheckCircleOutlined className="text-lg" /> Không thấy vấn đề da đáng chú ý trên ảnh. Tiếp tục duy trì chu trình dưỡng da nhé!
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {groupFindingsByZone(findings).map(([zone, items]) => {
        const active = activeZone === zone;
        return (
          <li key={zone}>
            <button
              type="button"
              onClick={() => onSelectZone?.(active ? null : zone)}
              aria-pressed={active}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active ? "border-[#e16463] bg-[#fff4f2]" : "border-[#f0dcdc] bg-white hover:border-[#e88f98]"
              }`}
            >
              <p className="mb-2 font-semibold text-[#2d2020]">{FACE_ZONE_LABEL[zone]}</p>
              <ul className="flex flex-col gap-2">
                {items.map((finding, index) => (
                  <li key={`${finding.concern}-${index}`} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#5b4747]">{SKIN_CONCERN_LABEL[finding.concern]}</span>
                      <Tag color={SEVERITY[finding.severity].color} className="!m-0">
                        {SEVERITY[finding.severity].label}
                      </Tag>
                    </div>
                    {finding.note && <p className="mt-0.5 text-[#8f7676]">{finding.note}</p>}
                  </li>
                ))}
              </ul>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
