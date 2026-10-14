import { Empty, Segmented } from "antd";
import { useMemo, useState } from "react";
import type { SkinConcern, SkinRecommendation, SkinType } from "../../types/skin";
import { SKIN_CONCERN_LABEL, SKIN_TYPE_LABEL } from "../../utils/skin";
import ProductCard from "../productCard";

const ALL = "all";

interface Props {
  recommendations: SkinRecommendation[];
  concerns: SkinConcern[];
  skinType: SkinType;
}

/** Sản phẩm gợi ý, lọc nhanh theo từng vấn đề da; mỗi thẻ ghi rõ vì sao được gợi ý */
export default function SkinRecommendations({ recommendations, concerns, skinType }: Props) {
  const [filter, setFilter] = useState<string>(ALL);

  // Chỉ hiện các vấn đề có sản phẩm phù hợp
  const options = useMemo(() => {
    const available = concerns.filter((concern) =>
      recommendations.some((rec) => rec.matchedConcerns.includes(concern)),
    );
    return [
      { label: "Tất cả", value: ALL },
      ...available.map((concern) => ({ label: SKIN_CONCERN_LABEL[concern], value: concern })),
    ];
  }, [concerns, recommendations]);

  const visible =
    filter === ALL ? recommendations : recommendations.filter((rec) => rec.matchedConcerns.includes(filter as SkinConcern));

  if (recommendations.length === 0) {
    return (
      <Empty
        description="Shop chưa có sản phẩm được gắn nhãn phù hợp với tình trạng da này. Bạn có thể chat với tư vấn viên để được gợi ý thêm."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {options.length > 2 && (
        <div className="overflow-x-auto">
          <Segmented options={options} value={filter} onChange={(value) => setFilter(String(value))} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {visible.map((rec) => (
          <div key={rec.productId} className="flex flex-col gap-2">
            <ProductCard product={rec.product} />
            <p className="px-1 text-xs leading-5 text-[#8f6060]">
              <span className="font-medium">Phù hợp: </span>
              {[
                ...rec.matchedConcerns.map((concern) => SKIN_CONCERN_LABEL[concern]),
                ...(rec.matchesSkinType ? [SKIN_TYPE_LABEL[skinType]] : []),
              ].join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
