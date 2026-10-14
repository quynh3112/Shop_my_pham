import {
  CustomerServiceOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";

// Điểm nổi bật dựa trên chức năng thật của web (không bịa cam kết)
const HIGHLIGHTS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <SafetyCertificateOutlined />, title: "Hàng chính hãng", text: "Nguồn gốc rõ ràng, tuyển chọn kỹ lưỡng" },
  { icon: <WalletOutlined />, title: "Thanh toán linh hoạt", text: "Trả tiền khi nhận hàng (COD) hoặc MoMo" },
  { icon: <ExperimentOutlined />, title: "Soi da bằng AI", text: "Phân tích da, gợi ý sản phẩm phù hợp" },
  { icon: <CustomerServiceOutlined />, title: "Tư vấn trực tuyến", text: "Chat với trợ lý AI hoặc nhân viên" },
];

const SHOPPING_LINKS = [
  { to: "/products", label: "Tất cả sản phẩm" },
  { to: "/products?sort=newest", label: "Hàng mới về" },
  { to: "/products?sort=best-selling", label: "Bán chạy" },
  { to: "/news", label: "Tin tức & ưu đãi" },
  { to: "/skin-analysis", label: "Soi da AI" },
];

const ACCOUNT_LINKS = [
  { to: "/orders", label: "Đơn hàng của tôi" },
  { to: "/favorites", label: "Sản phẩm yêu thích" },
  { to: "/cart", label: "Giỏ hàng" },
  { to: "/skin-analysis", label: "Lịch sử phân tích da" },
];

const LINK_CLASS = "text-sm !text-[#765f5f] transition-colors hover:!text-[#e16463]";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2d2020]">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const { categories, fetchCategory } = useCategory();

  useEffect(() => {
    void fetchCategory();
  }, []);

  return (
    <footer className="mt-16 border-t border-[#f3d4d7] bg-[#fffafa]">
      {/* Điểm nổi bật */}
      <div className="border-b border-[#f3d4d7]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#f3d4d7] bg-white text-lg text-[#e16463]">
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#2d2020]">{item.title}</p>
                <p className="text-xs leading-5 text-[#987979]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12">
        <div>
          <Link to="/" className="font-['Cormorant_Garamond'] text-3xl font-bold tracking-wide !text-[#2d2020]">
            LUNELLE
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#765f5f]">
            Chuyên cung cấp mỹ phẩm cao cấp chính hãng từ những thương hiệu được yêu thích trên thế giới, giúp bạn an
            tâm chăm sóc làn da và tôn vinh vẻ đẹp riêng mỗi ngày.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-block border border-[#e16463] px-4 py-2 text-sm font-medium !text-[#e16463] transition-colors hover:bg-[#e16463] hover:!text-white"
          >
            Mua sắm ngay
          </Link>
        </div>

        <FooterColumn title="Danh mục">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={`/products?categoryId=${category.id}`} className={LINK_CLASS}>
                {category.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Mua sắm">
          {SHOPPING_LINKS.map((link) => (
            <li key={link.to + link.label}>
              <Link to={link.to} className={LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Tài khoản">
          {ACCOUNT_LINKS.map((link) => (
            <li key={link.to + link.label}>
              <Link to={link.to} className={LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-[#f3d4d7]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-[#987979] sm:flex-row lg:px-12">
          <p>© {new Date().getFullYear()} LUNELLE. Mỹ phẩm chính hãng.</p>
          <p>Kết quả soi da bằng AI chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ da liễu.</p>
        </div>
      </div>
    </footer>
  );
}
