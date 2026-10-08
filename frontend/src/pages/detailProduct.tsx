import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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

export default function DetailProduct({ productId }: Props) {
  const validProductId = Number.isInteger(productId) && productId > 0;
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

  if (!validProductId)
    return <p className="p-6 text-red-600">Mã sản phẩm không hợp lệ.</p>;
  if (isPending) return <p className="p-6">Đang tải...</p>;
  if (error) return <p className="p-6 text-red-600">Lỗi: {error.message}</p>;
  if (!product) return <p className="p-6">Không tìm thấy sản phẩm.</p>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div>
        <img
          src="https://i.pinimg.com/736x/b6/6e/0c/b66e0c1552b3a284b9e20f55db5236e1.jpg"
          alt=""
        />
        <div>
          <h1>{product.name}</h1>
          <h1>{product.price?.toFixed(2)}</h1>
        </div>
      </div>
    </div>
  );
}
