import { useEffect } from "react";
import { Link } from "react-router-dom";
import HomeCategoryTile from "../component/homeCategoryTile";
import HomeProductSection from "../component/homeProductSection";
import useCategory from "../hooks/useCategory";
import { useBestSellers, useNewProducts } from "../hooks/useProductCollections";

// Ô danh mục ở trang chủ: gắn với danh mục thật theo slug (không phụ thuộc id trong DB)
const HOME_CATEGORIES = [
  { slug: "skincare", label: "Skincare", image: "https://i.pinimg.com/1200x/a3/20/48/a320481f501bec266ffc9c8c494cff69.jpg" },
  { slug: "makeup", label: "Makeup", image: "https://i.pinimg.com/736x/3a/cc/58/3acc58ff2232a962db63fd17cf0c51ad.jpg" },
  { slug: "gift-set", label: "Gift & Sets", image: "https://i.pinimg.com/1200x/2a/ab/1e/2aab1e2156a7873aeec72c2be82fefe4.jpg" },
];

export default function Home() {
  const bestSellers = useBestSellers();
  const newProducts = useNewProducts();
  const { categories, fetchCategory } = useCategory();

  useEffect(() => {
    void fetchCategory();
  }, []);

  // Không tìm thấy danh mục (vd. đã bị xoá / đổi slug) thì về trang tất cả sản phẩm
  const categoryLink = (slug: string) => {
    const category = categories.find((item) => item.slug === slug);
    return category ? `/products?categoryId=${category.id}` : "/products";
  };

  return (
    <div>
      
      <div className="relative h-screen ">
        <div className="w-[50%] ml-[50px] absolute left-0">
          <h2 className="text-7xl font-['Bodoni_72'] font-bold text-black mt-10">
            REVEAL YOUR BEAUTY <span className="font-['Allura']">with </span>
            SKINCARE
          </h2>
          <div>
            <h3 className="text-black font-bold font-['Bodoni_72'] text-2xl mt-5">
              <span className="font-['Allura'] text-[#E16463]">Our</span>{" "}
              Philosophy
            </h3>
            {/* Rộng tới hết chữ "YOUR" của tiêu đề (tiêu đề cỡ chữ cố định nên dùng px) */}
            <p className="text-black w-full max-w-[590px] leading-relaxed">
              LUNELLE chuyên cung cấp mỹ phẩm cao cấp chính hãng từ những
              thương hiệu được yêu thích trên thế giới. Mỗi sản phẩm đều có
              nguồn gốc rõ ràng và được tuyển chọn kỹ lưỡng, để bạn an tâm
              chăm sóc làn da và tôn vinh vẻ đẹp riêng của mình mỗi ngày.
            </p>
          </div>
          <Link
            to="/products"
            className="attention-wiggle font-['Bodoni_72'] text-2xl border border-[#E16463] px-2 rounded-lg !text-inherit mt-3 transition-colors hover:bg-[#E16463] hover:!text-white"
          >
            Shop Now
          </Link>
        </div>
        <div className="absolute right-16 top-12 h-[580px] w-[520px]">
          {/* Viền hồng phía sau */}
          <div
            className="
      absolute
      top-8
      -right-7
      h-full
      w-full
      rounded-t-full
      border
      border-[#e88f98]
    "
          />

          {/* Khung ảnh */}
          <div
            className="
      relative
      h-full
      w-full
      overflow-hidden
      rounded-t-full
      bg-gray-200
    "
          >
            <img
              src="https://i.pinimg.com/736x/75/14/37/751437b7a230d0d519d5bfe3abe680a6.jpg"
              alt="Skincare"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
      <div className="border border-[#E16463] relative mt-4">
        <span className="absolute -bottom-4 left-[70%] text-3xl text-[#c87985]">
          ✦
        </span>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <h2 className="w-full text-5xl font-['Bodoni_72'] font-bold md:w-[50%] md:text-7xl">
          <span className="font-['Allura']">our</span> PRODUCT CATEGORY
        </h2>
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {HOME_CATEGORIES.map((tile) => (
            <HomeCategoryTile key={tile.slug} to={categoryLink(tile.slug)} image={tile.image} label={tile.label} />
          ))}
        </div>
      </div>
      <div className="relative border border-[#e88f98] mt-10 ">
        <span className="absolute left-[40%] -bottom-4 text-3xl text-[#E16463]">
          {" "}
          ✦
        </span>
      </div>
      <HomeProductSection
        label="Sản phẩm bán chạy"
        title={<>PRODUCT <span className="font-['Allura']">bestseller</span></>}
        products={bestSellers.products}
        loading={bestSellers.loading}
      />
      <div className="relative border border-[#e88f98]">
        <span className="absolute -top-5 left-[60%] text-3xl text-[#c87985]">✦</span>
      </div>
      <HomeProductSection
        label="Sản phẩm mới"
        title={<>NEW <span className="font-['Allura']">arrivals</span></>}
        products={newProducts.products}
        loading={newProducts.loading}
        moreLink="/products?sort=newest"
      />
    </div>
  );
}
