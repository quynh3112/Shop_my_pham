export interface ProductCreateInput {
  name: string;
  description?: string | null;
  price: number;
  categoryId: number;
  isActive?: boolean;
  variants: ProductVariantCreateInput[];
}
export interface ProductVariantCreateInput {
  name: string; // "Đỏ đất", "Shade 01", "Mini"...
  size?: string; // "10ml", "30ml"... — có thể rỗng nếu sản phẩm không phân biệt dung tích
  initialStock: number;
}

export type ProductUpdateVariantInput =
  | { id: number; size: string; name: string }
  | { size: string; name: string; initialStock: number };

export interface ProductCreateInput {
  name: string;
  description?: string | null;
  price: number;
  categoryId: number;
  isActive?: boolean;
  variants: ProductVariantCreateInput[];
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  categoryId?: number;
  isActive?: boolean;
  variants?: ProductUpdateVariantInput[];
}

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  variantName?: string;
  size?: string;
  sort: 'newest' | 'price-asc' | 'price-desc' | 'name';
  page: number;
  limit: number;
}
