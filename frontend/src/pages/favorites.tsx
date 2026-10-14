import { HeartOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Skeleton } from "antd";
import { Link } from "react-router-dom";
import AccountPageLayout from "../component/accountPageLayout";
import ProductCard from "../component/productCard";
import useFavorite from "../hooks/useFavorite";
import type { ProductItem } from "../types/product";

export default function Favorites() {
  const { favorites, loading, error } = useFavorite();
  // Sản phẩm bị xoá khỏi shop thì favorite không còn product -> bỏ qua
  const products = favorites
    .map((favorite) => favorite.product)
    .filter((product): product is ProductItem => Boolean(product));

  return (
    <AccountPageLayout
      title="Sản phẩm yêu thích"
      description={
        products.length > 0
          ? `${products.length} sản phẩm · bấm vào trái tim để bỏ khỏi danh sách.`
          : undefined
      }
    >
      {error && <Alert type="error" showIcon message="Không tải được danh sách yêu thích" description={error} className="!mb-6" />}

      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 4 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#e8caca] bg-white py-16">
          <Empty
            image={<HeartOutlined className="text-6xl text-[#e88f98]" />}
            description="Bạn chưa thích sản phẩm nào."
          >
            <Link to="/products">
              <Button type="primary">Khám phá sản phẩm</Button>
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </AccountPageLayout>
  );
}
