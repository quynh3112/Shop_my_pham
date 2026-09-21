import { useEffect } from "react";
import Header from "../component/header";
import useProduct from "../hooks/useProduct";
import { ArrowRightOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Card } from "antd";

export default function Home() {
  const { products, fetchProducts } = useProduct();

  useEffect(() => {
    void fetchProducts({ sort: "newest", page: 1, limit: 4 });
  }, []);

  return (
    <div>
      <Header />
      <div className="relative border border-[#e88f98] mt-10">
        {/* sparkle trên */}
        <span className="absolute -top-5 left-[20%] text-3xl text-[#c87985]">
          ✦
        </span>
      </div>
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
            <p className="text-black w-1/2  ">
              It is a long established fact that a reader will be distracted by
              the readable of a page when looking at its layput. The point of
              using Lorem ipsum dolor sit amet consectetur, adipisicing elit.
              Pariatur enim quis dicta? Voluptatum aspernatur facere saepe quo,
              quisquam sequi exercitationem sapiente. Nostrum quisquam nisi
              voluptas soluta? Nobis voluptatem neque dolores!
            </p>
          </div>
          <button className="font-['Bodoni_72'] text-2xl border border-[#E16463] px-2 rounded-lg">
            Shop Now
          </button>
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
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg">
            <img
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              src="https://i.pinimg.com/1200x/a3/20/48/a320481f501bec266ffc9c8c494cff69.jpg"
              alt=""
            />

            {/* Màn phủ */}
            <div className="absolute inset-0 bg-[#c87985]/30 opacity-0 transition duration-500 group-hover:opacity-100"></div>

            {/* Chữ */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-semibold text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                Skincare
              </span>
            </div>
          </div>
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg">
            <img
              className=" w-full h-full object-cover group-hover:scale-105 transition duration-500"
              src="https://i.pinimg.com/736x/3a/cc/58/3acc58ff2232a962db63fd17cf0c51ad.jpg"
              alt=""
            />
            <div className="absolute inset-0 bg-[#c87985]/30 opacity-0 transition duration-500 group-hover:opacity-100"></div>

            {/* Chữ */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-semibold text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
               Makeup
              </span>
            </div>

          </div>
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              src="https://i.pinimg.com/1200x/2a/ab/1e/2aab1e2156a7873aeec72c2be82fefe4.jpg"
              alt=""
            />
            <div className=" absolute inset-0  bg-[#c87985]/30 opacity-0 transition duration-500 group-hover:opacity-100"></div>
            <div className="inset-0 absolute flex justify-center items-center">
             <span className="text-4xl font-semibold text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
               Gift & Sets
              </span>
            </div>
          </div>

        </div>
      </div>
      <div className="relative border border-[#e88f98] mt-10 ">
        <span className="absolute left-[40%] -bottom-4 text-3xl text-[#E16463]"> ✦</span>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-10">
        <h2 className="text-7xl font-['Bodoni_72'] font-bold text-center">
          PRODUCT <span className="font-['Allura']">bestseller</span>
        </h2>
        <div className="grid grid-cols-4 gap-4 mt-10 ">
          {products.map((product)=> (
           <div key={product.id} className="rounded-lg overflow-hidden  h-[515px]">
            <Card className="group relative overflow-hidden rounded-lg h-[430px]">
              <img src={product.image} alt={product.name} />
              <div className="absolute inset-0 bg-[#c87985]/30 opacity-0 transition duration-500 group-hover:opacity-100"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className=" font-semibold text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                 view more
                </span>
              </div>
            </Card>
            <div className="product-name"> {product.name}</div>
            <div className="product-price">
              <p>{product.price?.toFixed(0)}vnd</p>
              <p><ShoppingCartOutlined /></p>
            </div>

           </div>
          )
          )}
        </div>
        <p className="text-xl text-[#E16463] font-bold cursor-pointer hover:underline">
         Show more <ArrowRightOutlined className="inline-block w-4 h-4 ml-1" />
        </p>
      </div>
    </div>
  );
}
