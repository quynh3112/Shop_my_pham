export interface ProductCreateInput {
  name: string;
  description?: string | null;
  price: number;
  categoryId: number;
  isActive?: boolean;
  skinTypes?: string[];
  concerns?: string[];
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
  skinTypes?: string[];
  concerns?: string[];
  variants: ProductVariantCreateInput[];
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  categoryId?: number;
  isActive?: boolean;
  skinTypes?: string[];
  concerns?: string[];
  variants?: ProductUpdateVariantInput[];
}

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  variantName?: string;
  size?: string;
  /** Mã loại da / vấn đề da, nhận "oily,dry" hoặc lặp tham số ?skinTypes=oily&skinTypes=dry */
  skinTypes?: string | string[];
  concerns?: string | string[];
  minRating?: number;
  inStock?: boolean | string;
  sort?: ProductSort;
  page: number;
  limit: number;
}

export type ProductSort =
  | 'relevance'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name'
  | 'best-selling'
  | 'rating'
  // Cá nhân hoá theo phân tích da / yêu thích / đã mua (khách vãng lai: theo độ phổ biến)
  | 'for-you';
