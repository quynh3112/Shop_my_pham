import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { Alert, Spin, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import ProductDescription from "../component/productDescription";
import ProductGallery from "../component/productGallery";
import ProductPurchaseForm from "../component/productPurchaseForm";
import ProductRatingFavorite from "../component/productRatingFavorite";
import Review from "../component/review";
import useCart from "../hooks/useCart";
import useRequireLogin from "../hooks/useRequireLogin";
=======
>>>>>>> 40b063339a7d7d95efab10c3f168ef753504ab24
import { getProducById } from "../service/product.service";
import type { ProductItem } from "../types/product";

interface Props {
  productId: number;
}

const getProductFromResponse = (
  payload: unknown,
  productId: number,
): ProductItem | null => {
  if (Array.isArray(payload)) {
    const matchingProduct = payload.find(
      (item): item is ProductItem =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        Number(item.id) === productId,
    );
    return matchingProduct ?? null;
  }

  if (typeof payload !== "object" || payload === null) return null;

  if ("name" in payload && ("id" in payload || "_id" in payload)) {
    return payload as ProductItem;
  }

  const response = payload as Record<string, unknown>;
  for (const key of ["data", "product", "result"]) {
    if (key in response) {
      const product = getProductFromResponse(response[key], productId);
      if (product) return product;
    }
  }

  return null;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);

export default function DetailProduct({ productId }: Props) {
  const validProductId = Number.isInteger(productId) && productId > 0;
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { addCart, isMutating } = useCart();
  const { requireLogin, handleAuthError } = useRequireLogin();
  const {
    data: product,
    isPending,
    error,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () =>
      getProductFromResponse(await getProducById(productId), productId),
    enabled: validProductId,
  });

  const handlePurchase = async (
    variantId: number,
    quantity: number,
    buyNow: boolean,
  ) => {
    if (!requireLogin()) return;
    try {
      await addCart({ variantId, quantity });
      if (buyNow) {
        navigate("/cart");
        return;
      }
      messageApi.success("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (purchaseError) {
      if (handleAuthError(purchaseError)) return;
      messageApi.error(
        purchaseError instanceof Error
          ? `Không thể thêm vào giỏ hàng: ${purchaseError.message}`
          : "Không thể thêm sản phẩm vào giỏ hàng.",
      );
    }
  };

  if (!validProductId)
    return <p className="p-6 text-red-600">Mã sản phẩm không hợp lệ.</p>;
  if (isPending)
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Alert
          type="error"
          showIcon
          message="Không thể tải sản phẩm"
          description={error.message}
        />
      </div>
    );
  if (!product)
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Alert type="warning" showIcon message="Không tìm thấy sản phẩm" />
      </div>
    );

  const variants = product.variants ?? [];
  const stock = product.stock ??
    variants.reduce(
      (total, variant) => total + (variant.stock ?? variant.initialStock ?? 0),
      0,
    );
  const images = Array.from(
    new Set(
      [...(product.images ?? []), product.image].filter(
        (image): image is string => typeof image === "string" && image.length > 0,
      ),
    ),
  );
  if (images.length === 0) {
    images.push(
      "https://i.pinimg.com/736x/b6/6e/0c/b66e0c1552b3a284b9e20f55db5236e1.jpg",
    );
  }

  return (
    <>
      {contextHolder}
      <main className="min-h-screen bg-[#fffafa] px-4 py-8 text-[#362727] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-sm text-[#a17e7e]">
            <Link to="/" className="!text-[#a17e7e] hover:!text-[#c9696b]">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="!text-[#a17e7e] hover:!text-[#c9696b]">Sản phẩm</Link>
            <span className="mx-2">/</span>
            <span className="text-[#583f3f]">{product.name}</span>
          </p>
          <section className="grid gap-8 rounded-2xl bg-white p-5 shadow-[0_12px_45px_rgba(112,65,65,0.08)] sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-12">
            <ProductGallery
              images={images}
              productName={product.name}
              inStock={stock > 0}
            />

            <div className="flex flex-col py-1 lg:py-4">
              {product.category?.name && (
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#bd8585]">
                  {product.category.name}
                </p>
              )}
              <h1 className="!mb-3 !text-3xl !font-normal !leading-tight !text-[#3b2929] sm:!text-4xl">
                {product.name}
              </h1>
              <ProductRatingFavorite productId={productId} />

              <p className="border-b border-[#f1e2e0] pb-6 text-2xl font-medium text-[#c9696b] sm:text-3xl">
                {formatPrice(product.price ?? 0)}
              </p>

              <ProductPurchaseForm
                variants={variants}
                productStock={product.stock}
                isMutating={isMutating}
                onPurchase={(variantId, quantity, buyNow) =>
                  void handlePurchase(variantId, quantity, buyNow)
                }
              />
            </div>
          </section>

          <ProductDescription
            description={product.description}
            pdfUrl={product.descriptionPdfUrl}
          />
          <Review productId={productId} />
        </div>
      </main>
    </>
  );
}
