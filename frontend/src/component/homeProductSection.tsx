import { ArrowRightOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ProductItem } from "../types/product";
import ProductCarousel from "./productCarousel";

interface Props {
  /** Tiêu đề hiển thị (có thể chứa font Allura) */
  title: ReactNode;
  /** Tên mục cho trình đọc màn hình */
  label: string;
  products: ProductItem[];
  loading?: boolean;
  moreLink?: string;
}

export default function HomeProductSection({ title, label, products, loading, moreLink = "/products" }: Props) {
  return (
    <section className="flex flex-col items-center px-6 py-12 lg:px-10">
      <h2 className="text-center font-['Bodoni_72'] text-5xl font-bold md:text-7xl">{title}</h2>
      <div className="mt-10 w-full max-w-7xl">
        <ProductCarousel products={products} loading={loading} label={label} />
      </div>
      <Link to={moreLink} className="mt-8 text-xl font-bold !text-[#E16463] hover:underline">
        Show more <ArrowRightOutlined className="ml-1 inline-block h-4 w-4" />
      </Link>
    </section>
  );
}
