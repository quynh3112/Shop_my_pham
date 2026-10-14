import { HeartFilled, HeartOutlined, ShoppingOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import useFavorite from "../hooks/useFavorite";
import useRequireLogin from "../hooks/useRequireLogin";
import { getProductImageUrls } from "../service/product.service";
import type { ProductItem } from "../types/product";
import { getApiErrorMessage } from "../utils/error";
import { formatPrice } from "../utils/format";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80";

interface Props {
  product: ProductItem;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { requireLogin, handleAuthError } = useRequireLogin();
  const { isFavorite, addFavorite, removeFavorite, isMutating } = useFavorite();

  const productId = product.id;
  const [cover = FALLBACK_IMAGE, hoverImage] = getProductImageUrls(product);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const favorite = productId !== undefined && isFavorite(productId);
  const detailPath = productId !== undefined ? `/product/${productId}` : undefined;

  const openDetail = () => {
    if (detailPath) navigate(detailPath);
  };

  const toggleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (productId === undefined || !requireLogin()) return;
    try {
      if (favorite) await removeFavorite(productId);
      else await addFavorite({ productId });
    } catch (error) {
      if (!handleAuthError(error)) {
        message.error(getApiErrorMessage(error, "Không thể cập nhật yêu thích."));
      }
    }
  };

  return (
    <article
      className="group flex cursor-pointer flex-col"
      onClick={openDetail}
      onKeyDown={(event) => event.key === "Enter" && openDetail()}
      tabIndex={0}
      aria-label={product.name}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#fbf1ef]">
        <img
          src={cover}
          alt={product.name}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
            hoverImage ? "group-hover:opacity-0" : ""
          } ${outOfStock ? "grayscale-[40%]" : ""}`}
        />
        {hoverImage && (
          <img
            src={hoverImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-700 group-hover:scale-100 group-hover:opacity-100"
          />
        )}

        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#8f6060] shadow-sm">
            Hết hàng
          </span>
        )}

        <button
          type="button"
          aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={favorite}
          disabled={isMutating}
          onClick={(event) => void toggleFavorite(event)}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base shadow-sm backdrop-blur transition hover:scale-110 disabled:opacity-60 ${
            favorite ? "text-[#e16463]" : "text-[#8f6060] hover:text-[#e16463]"
          }`}
        >
          {favorite ? <HeartFilled /> : <HeartOutlined />}
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <span className="flex items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-sm font-medium text-[#2d2020] shadow-md">
            <ShoppingOutlined /> {outOfStock ? "Xem chi tiết" : "Chọn mua"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        {product.category?.name && (
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#bd8585]">
            {product.category.name}
          </p>
        )}
        <h3 className="mb-2 line-clamp-2 font-['Cormorant_Garamond'] text-xl font-semibold leading-snug text-[#2d2020] transition-colors group-hover:text-[#e16463]">
          {product.name}
        </h3>
        <p className="mt-auto text-base font-semibold text-[#e16463]">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}
