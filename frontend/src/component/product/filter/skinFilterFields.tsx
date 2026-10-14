import { Select } from "antd";
import type { SkinConcern, SkinType } from "../../../types/skin";
import { SKIN_CONCERN_OPTIONS, SKIN_TYPE_OPTIONS } from "../../../utils/skin";
import FilterSection from "./filterSection";

interface Props {
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  onChange: (patch: { skinTypes?: SkinType[]; concerns?: SkinConcern[] }) => void;
}

/** Lọc theo loại da + vấn đề da (chỉ dùng cho sản phẩm Skincare) */
export default function SkinFilterFields({ skinTypes, concerns, onChange }: Props) {
  return (
    <>
      <FilterSection label="Loại da">
        <Select
          mode="multiple"
          allowClear
          size="large"
          style={{ width: "100%" }}
          placeholder="Chọn loại da"
          options={SKIN_TYPE_OPTIONS}
          value={skinTypes}
          onChange={(value: SkinType[]) => onChange({ skinTypes: value })}
        />
      </FilterSection>
      <FilterSection label="Vấn đề da">
        <Select
          mode="multiple"
          allowClear
          size="large"
          style={{ width: "100%" }}
          placeholder="VD: mụn, thâm, lỗ chân lông"
          options={SKIN_CONCERN_OPTIONS}
          value={concerns}
          onChange={(value: SkinConcern[]) => onChange({ concerns: value })}
        />
      </FilterSection>
    </>
  );
}
