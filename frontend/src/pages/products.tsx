import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Input, InputNumber, Select, Spin, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../service/product.service";
import useCategory from "../hooks/useCategory";
import type { ProductItem, ProductQuery } from "../types/product";
import type { Category } from "../types/category";

interface Props {
  query?: ProductQuery;
}

const flattenCategories = (items: Category[]): Category[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children ?? [])]);

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
  sort: query?.sort ?? "newest",
  page: query?.page ?? 1,
  limit: query?.limit ?? 20,
});

export default function Products({ query }: Props) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductQuery>(() => defaultQuery(query));
  const [appliedQuery, setAppliedQuery] = useState<ProductQuery>(() => defaultQuery(query));
  const { categories, fetchCategory, loading: categoryLoading, error: categoryError } = useCategory();

  const productsQuery = useQuery({
    queryKey: ["products", appliedQuery],
    queryFn: async () => normalizeProducts(await getProducts(appliedQuery)),
  });

  useEffect(() => {
    void fetchCategory();
  }, []);

  const categoryOptions = useMemo(
    () =>
      flattenCategories(categories).map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
  );

  const updateFilter = <K extends keyof ProductQuery>(key: K, value: ProductQuery[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
    ) as ProductQuery;
    setAppliedQuery({ ...nextQuery, page: 1, limit: filters.limit ?? 20 });
    setFilters((current) => ({ ...current, page: 1 }));
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
        <aside className="w-full rounded-2xl border border-[#f3d5d7] bg-white p-5 shadow-sm lg:w-[300px] lg:shrink-0">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#3d2a2a]">Bộ lọc sản phẩm</h3>
            <Button type="link" onClick={resetFilters} className="p-0 text-[#d9797d]">
              Xóa lọc
            </Button>
          </div>

          <form onSubmit={applyFilters} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tìm kiếm
              </label>
              <Input
                allowClear
                size="large"
                placeholder="Tên hoặc mô tả"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value || undefined)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Thể loại
              </label>
              <Select
                allowClear
                size="large"
                style={{ width: "100%" }}
                placeholder="Chọn thể loại"
                options={categoryOptions}
                value={filters.categoryId}
                onChange={(value) => updateFilter("categoryId", value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Khoảng giá
              </label>
              <div className="grid grid-cols-2 gap-3">
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Từ"
                  value={filters.minPrice}
                  onChange={(value) => updateFilter("minPrice", value ?? undefined)}
                />
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Đến"
                  value={filters.maxPrice}
                  onChange={(value) => updateFilter("maxPrice", value ?? undefined)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kích cỡ biến thể
              </label>
              <Input
                allowClear
                size="large"
                placeholder="VD: 50ml, M"
                value={filters.variantSize}
                onChange={(event) => updateFilter("variantSize", event.target.value || undefined)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Size
              </label>
              <Input
                allowClear
                size="large"
                placeholder="Nhập size"
                value={filters.size}
                onChange={(event) => updateFilter("size", event.target.value || undefined)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sắp xếp
              </label>
              <Select
                size="large"
                style={{ width: "100%" }}
                value={filters.sort}
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "price-asc", label: "Giá tăng dần" },
                  { value: "price-desc", label: "Giá giảm dần" },
                  { value: "name", label: "Tên sản phẩm" },
                ]}
                onChange={(value: ProductQuery["sort"]) => updateFilter("sort", value)}
              />
            </div>

            

            <Button
              htmlType="submit"
              type="primary"
              block
              loading={productsQuery.isFetching}
              className="border-[#d9797d] bg-[#d9797d] hover:!border-[#c8676b] hover:!bg-[#c8676b]"
            >
              Tìm sản phẩm
            </Button>
          </form>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#3d2a2a]">Danh sách sản phẩm</h2>
              <p className="text-sm text-gray-500">
                Hiển thị {products.length} sản phẩm
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-lg font-medium text-gray-500">
                Không tìm thấy sản phẩm phù hợp
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product: ProductItem) => (
                <Card
                  key={product.id ?? product.name}
                  hoverable
                  onClick={() => product.id !== undefined && navigate(`/product/${product.id}`)}
                  cover={
                    <img
                      alt={product.name}
                      src={
                        product.image ??
                        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
                      }
                      className="h-60 w-full object-cover"
                    />
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Tag color={product.isActive ? "green" : "default"}>
                      {product.isActive ? "Đang bán" : "Ngừng bán"}
                    </Tag>
                    <span className="text-xs text-gray-400">
                      {product.category?.name ?? `Danh mục ${product.categoryId ?? ""}`}
                    </span>
                  </div>

                  <h3 className="mb-2 line-clamp-2 min-h-[48px] text-lg font-semibold text-[#3d2a2a]">
                    {product.name}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                    {product.description || "Chưa có mô tả cho sản phẩm này."}
                  </p>
                  <p className="text-xl font-bold text-[#d9797d]">
                    {Number(product.price ?? 0).toLocaleString("vi-VN")}đ
                  </p>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
