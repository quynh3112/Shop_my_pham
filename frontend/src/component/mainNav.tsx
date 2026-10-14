import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import CategoryMenu from "./category";
import NewsMenu from "./news/newsMenu";

// Gạch chân hồng khi rê chuột / đang ở trang đó (aria-current="page")
const NAV_ITEM =
  "relative inline-flex items-center gap-1 whitespace-nowrap py-4 text-[13px] font-medium uppercase tracking-[0.14em] !text-[#2d2020] transition-colors hover:!text-[#e16463] " +
  "after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-center after:scale-x-0 after:bg-[#e16463] after:transition-transform after:duration-300 " +
  "hover:after:scale-x-100 aria-[current=page]:!text-[#e16463] aria-[current=page]:after:scale-x-100";

export default function MainNav() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const categoryId = Number(searchParams.get("categoryId")) || undefined;
  const onProducts = pathname === "/products";
  const [scrolled, setScrolled] = useState(false);

  // Đã cuộn khỏi đầu trang thì thêm bóng để nav tách khỏi nội dung bên dưới
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Điều hướng chính"
      className={`sticky top-0 z-40 border-y border-[#f3d4d7] bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-[0_8px_24px_rgba(112,65,65,0.08)]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-x-8 overflow-x-auto px-6 lg:justify-center lg:px-12">
        <Link to="/" className={NAV_ITEM} aria-current={pathname === "/" ? "page" : undefined}>
          Trang chủ
        </Link>
        <Link
          to="/products"
          className={NAV_ITEM}
          aria-current={onProducts && !categoryId ? "page" : undefined}
        >
          Sản phẩm
        </Link>
        <CategoryMenu itemClassName={NAV_ITEM} activeCategoryId={onProducts ? categoryId : undefined} />
        <Link
          to="/skin-analysis"
          className={NAV_ITEM}
          aria-current={pathname.startsWith("/skin-analysis") ? "page" : undefined}
        >
          Soi da AI
        </Link>
        <NewsMenu className={NAV_ITEM} active={pathname === "/news"} />
      </div>
    </nav>
  );
}
