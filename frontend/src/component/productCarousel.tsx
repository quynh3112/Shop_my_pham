import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Empty, Skeleton } from "antd";
import { useEffect, useState } from "react";
import useItemsPerView from "../hooks/useItemsPerView";
import type { ProductItem } from "../types/product";
import ProductCard from "./productCard";

interface Props {
  products: ProductItem[];
  loading?: boolean;
  /** Thời gian tự chuyển sang sản phẩm tiếp theo (ms), 0 để tắt */
  autoplayMs?: number;
  label: string;
}

const NAV_BUTTON =
  "absolute top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#f3d4d7] bg-white/95 text-[#2d2020] shadow-md transition hover:border-[#e16463] hover:bg-[#e16463] hover:text-white disabled:pointer-events-none disabled:opacity-0";

/** Hàng sản phẩm trượt ngang: nút trước / sau, tự chuyển từng sản phẩm một */
export default function ProductCarousel({ products, loading, autoplayMs = 4000, label }: Props) {
  const itemsPerView = useItemsPerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, products.length - itemsPerView);
  const canSlide = maxIndex > 0;
  const current = Math.min(index, maxIndex);

  // Hết hàng thì quay lại đầu (và ngược lại) để chạy vòng liên tục
  const next = () => setIndex((value) => (Math.min(value, maxIndex) >= maxIndex ? 0 : value + 1));
  const prev = () => setIndex((value) => (Math.min(value, maxIndex) <= 0 ? maxIndex : value - 1));

  useEffect(() => {
    if (!canSlide || paused || !autoplayMs) return;
    const timer = window.setInterval(next, autoplayMs);
    return () => window.clearInterval(timer);
  }, [canSlide, paused, autoplayMs, maxIndex]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: itemsPerView }, (_, i) => (
          <div key={i}>
            <Skeleton.Node active className="!aspect-[4/5] !h-auto !w-full [&_.ant-skeleton-node]:!h-full [&_.ant-skeleton-node]:!w-full" />
            <Skeleton active title={false} paragraph={{ rows: 2 }} className="mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return <Empty description="Chưa có sản phẩm." />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="-mx-2 overflow-hidden md:-mx-3">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${(current * 100) / itemsPerView}%)` }}
        >
          {products.map((product, i) => (
            <div
              key={product.id ?? product.name}
              className="shrink-0 px-2 md:px-3"
              style={{ width: `${100 / itemsPerView}%` }}
              aria-hidden={i < current || i >= current + itemsPerView}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <button type="button" aria-label="Sản phẩm trước" className={`${NAV_BUTTON} -left-3 lg:-left-5`} onClick={prev} disabled={!canSlide}>
        <LeftOutlined />
      </button>
      <button type="button" aria-label="Sản phẩm tiếp theo" className={`${NAV_BUTTON} -right-3 lg:-right-5`} onClick={next} disabled={!canSlide}>
        <RightOutlined />
      </button>

      {canSlide && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Tới vị trí ${i + 1}`}
              aria-current={i === current}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-[#e16463]" : "w-1.5 bg-[#f3d4d7] hover:bg-[#e88f98]"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
