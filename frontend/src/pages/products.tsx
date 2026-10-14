import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { getProducts } from "../service/product.service";
import ProductCard from "../component/productCard";
import ProductFilter from "../component/product/filter/productFilter";
import ProductSortBar from "../component/product/productSortBar";
import useCategory from "../hooks/useCategory";
import { isLoggedIn } from "../utils/auth";
import type { ProductItem, ProductQuery } from "../types/product";

interface Props {
  query?: ProductQuery;
}

const normalizeProducts = (payload: unknown): ProductItem[] => {
  if (Array.isArray(payload)) return payload as ProductItem[];
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nested =
    data.data ??
    data.products ??
    data.result ??
    data.items ??
    data.docs;

  if (Array.isArray(nested)) return nested as ProductItem[];
  if (nested && typeof nested === "object") {
    const nestedData = nested as Record<string, unknown>;
    const items = nestedData.data ?? nestedData.items ?? nestedData.products ?? nestedData.docs;
    if (Array.isArray(items)) return items as ProductItem[];
  }

  return [];
};

const defaultQuery = (query?: ProductQuery): ProductQuery => ({
  ...query,
  // "Liên quan" chỉ có nghĩa khi đang tìm từ khoá; không tìm thì xem hàng mới
  sort: query?.sort ?? (query?.search ? "relevance" : "newest"),
  page: query?.page ?? 1,
  limit: query?.limit ?? 20,
});

export default function Products({ query }: Props) {
  const [filters, setFilters] = useState<ProductQuery>(() => defaultQuery(query));
  const [appliedQuery, setAppliedQuery] = useState<ProductQuery>(() => defaultQuery(query));
  const { categories, fetchCategory, loading: categoryLoading, error: categoryError } = useCategory();

  const productsQuery = useQuery({
    queryKey: ["products", appliedQuery],
    queryFn: async () => normalizeProducts(await getProducts(appliedQuery)),
    // Đổi sắp xếp / bộ lọc vẫn giữ danh sách cũ trong lúc tải, không nháy cả trang
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    void fetchCategory();
  }, []);

  const applyFilters = () => {
    // Bỏ các điều kiện rỗng trước khi gửi lên API
    const nextQuery = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) =>
          value !== undefined && value !== "" && value !== false && !(Array.isArray(value) && value.length === 0),
      ),
    ) as ProductQuery;
    const hasSearch = Boolean(nextQuery.search?.trim());
    const isNewSearch = hasSearch && nextQuery.search !== appliedQuery.search;
    // Tìm từ khoá mới -> xếp theo độ liên quan; bỏ từ khoá mà đang "Liên quan" -> về "Mới nhất"
    const sort: ProductQuery["sort"] = isNewSearch
      ? "relevance"
      : !hasSearch && nextQuery.sort === "relevance"
        ? "newest"
        : nextQuery.sort;
    setAppliedQuery({ ...nextQuery, sort, page: 1, limit: filters.limit ?? 20 });
    setFilters((current) => ({ ...current, sort, page: 1 }));
  };

  // Nút sắp xếp nhanh: áp dụng ngay, đồng bộ với ô "Sắp xếp" trong bộ lọc
  const changeSort = (sort: NonNullable<ProductQuery["sort"]>) => {
    setFilters((current) => ({ ...current, sort, page: 1 }));
    setAppliedQuery((current) => ({ ...current, sort, page: 1 }));
  };

  const resetFilters = () => {
    const resetQuery: ProductQuery = { sort: "newest", page: 1, limit: 20 };
    setFilters(resetQuery);
    setAppliedQuery(resetQuery);
  };

  const products = productsQuery.data ?? [];

  if (productsQuery.isPending || categoryLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" description="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (productsQuery.error || categoryError) {
    const errorMessage =
      productsQuery.error instanceof Error
        ? productsQuery.error.message
        : categoryError;
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
        Không tải được dữ liệu: {errorMessage}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <ProductFilter
          value={filters}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onApply={applyFilters}
          onReset={resetFilters}
          categories={categories}
          applying={productsQuery.isFetching}
        />

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#3d2a2a]">Danh sách sản phẩm</h2>
              <p className="text-sm text-gray-500">
                Hiển thị {products.length} sản phẩm
              </p>
            </div>
            <ProductSortBar
              value={appliedQuery.sort}
              onChange={changeSort}
              hasSearch={Boolean(appliedQuery.search)}
              loggedIn={isLoggedIn()}
              disabled={productsQuery.isFetching}
            />
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-lg font-medium text-gray-500">
                Không tìm thấy sản phẩm phù hợp
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
              {products.map((product: ProductItem) => (
                <div key={product.id ?? product.name} className="flex flex-col gap-2">
                  <ProductCard product={product} />
                  {/* "Dành cho bạn": vì sao sản phẩm được gợi ý */}
                  {appliedQuery.sort === "for-you" && product.recommendReasons?.length ? (
                    <p className="px-1 text-xs leading-5 text-[#8f6060]">
                      <span className="font-medium">Gợi ý vì: </span>
                      {product.recommendReasons.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
