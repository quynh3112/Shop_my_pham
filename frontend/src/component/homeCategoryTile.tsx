import { Link } from "react-router-dom";

interface Props {
  to: string;
  image: string;
  label: string;
}

/** Ô danh mục ở trang chủ: ảnh + tên hiện ra khi rê chuột, bấm để xem sản phẩm của danh mục */
export default function HomeCategoryTile({ to, image, label }: Props) {
  return (
    <Link
      to={to}
      aria-label={`Xem sản phẩm ${label}`}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg"
    >
      <img
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        src={image}
        alt={label}
        loading="lazy"
      />
      {/* Màn phủ */}
      <div className="absolute inset-0 bg-[#c87985]/30 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
      {/* Chữ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="translate-y-4 text-4xl font-semibold text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {label}
        </span>
      </div>
    </Link>
  );
}
