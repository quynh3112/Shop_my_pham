import type { SkinConcern, SkinType } from "./skin";
export interface ProductCreate{
    name:string
    description:string
    price:number
    categoryId:number,
    isActive:boolean
    // Nhãn cho phân tích da (mã trong utils/skin.ts)
    skinTypes?:string[]
    concerns?:string[]
    variants:ProductVariantCreate[]
}

export interface ProductItem {
    id?: number
    name: string
    description?: string | null
    descriptionPdfUrl?: string | null
    skinTypes?: string[]
    concerns?: string[]
    price?: number
    categoryId?: number
    isActive?: boolean
    image?: string
    // API trả về object ảnh, dữ liệu cũ có thể là chuỗi URL
    images?: (string | ProductImageItem)[]
    stock?: number
    sold?: number
    averageRating?: number
    /** Lý do gợi ý khi xếp "Dành cho bạn" (vd. "Trị mụn", "Hợp da dầu") */
    recommendReasons?: string[]
    reviewCount?: number
    category?: {
        id: number
        name: string
        slug?: string
        parentId?: number | null
    }
    variants?: ProductVariantItem[]
    createdAt?: string
    updatedAt?: string
}

export interface ProductVariantItem {
    id?: number
    variantId?: number
    name: string
    size: string
    stock?: number
    initialStock: number
}

export interface ProductVariantCreate{
    name:string
    size:string
    initialStock:number
}

export interface ProductVariantUpdate {
    id?: number
    name?: string
    size?: string
    initialStock?: number
}

export interface ProductQuery{
    search?:string
    categoryId?:number
    minPrice?:number
    maxPrice?:number
    variantName?:string
    size?:string
    skinTypes?: SkinType[]
    concerns?: SkinConcern[]
    minRating?: number
    inStock?: boolean
    sort?: 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'name' | 'best-selling' | 'rating' | 'for-you';
    page?: number;
    limit?: number;
}
export interface ProductUpdate{
    name?:string
    description?:string|null
    price?:number
    categoryId?:number
    isActive?:boolean
    skinTypes?:string[]
    concerns?:string[]
    variants?:ProductVariantUpdate[]


}
export type ProductUpdateVariantInput =
  | { id: number; size: string; name: string }
  | { size: string; name: string; initialStock: number };
  

export interface ProductImageItem {
    id: number
    url: string
    thumbUrl?: string | null
    sortOrder?: number
}
