import { ArrowRightOutlined } from "@ant-design/icons";
import { toFileUrl } from "../../service/product.service";
import type { Banner } from "../../types/banner";
import NewsLink from "./newsLink";

interface Props {
  banner: Banner;
  /** compact: dòng nhỏ trong menu; mặc định: thẻ lớn ở trang Tin tức */
  variant?: "default" | "compact";
  onNavigate?: () => void;
}

export default function NewsCard({ banner, variant = "default", onNavigate }: Props) {
  const image = banner.imageUrl ? toFileUrl(banner.imageUrl) : undefined;

  if (variant === "compact") {
    return (
      <NewsLink
        banner={banner}
        onNavigate={onNavigate}
        className="group flex items-center gap-3 rounded-xl p-2 !text-inherit transition hover:bg-[#fff4f2]"
      >
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#fbf1ef]">
          {image && (
            <img
              src={image}
              alt={banner.altText || banner.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <p className="line-clamp-2 text-sm font-medium text-[#2d2020] group-hover:text-[#e16463]">
          {banner.name}
        </p>
      </NewsLink>
    );
  }

  return (
    <article id={`news-${banner.id}`} className="scroll-mt-28">
      <NewsLink banner={banner} className="group block !text-inherit">
        <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-[#fbf1ef]">
          {image && (
            <img
              src={image}
              alt={banner.altText || banner.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          )}
        </div>
        <h3 className="mt-4 font-['Cormorant_Garamond'] text-2xl font-semibold leading-snug text-[#2d2020] transition-colors group-hover:text-[#e16463]">
          {banner.name}
        </h3>
        {banner.altText && banner.altText !== banner.name && (
          <p className="mt-1 line-clamp-2 text-sm text-[#8f7676]">{banner.altText}</p>
        )}
        {banner.linkUrl && (
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#e16463]">
            Xem chi tiết <ArrowRightOutlined className="text-xs transition group-hover:translate-x-1" />
          </span>
        )}
      </NewsLink>
    </article>
  );
}
