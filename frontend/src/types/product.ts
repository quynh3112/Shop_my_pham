export interface ProductCreate{
    name:string
    description:string
    price:number
    categoryId:number,
    isActive:boolean
    variants:ProductVariantCreate[]
}

export interface ProductItem {
    id?: number
    name: string
    description?: string | null
    price?: number
    categoryId?: number
    isActive?: boolean
    image?: string
    images?: string[]
    stock?: number
    sold?: number
    category?: {
        id: number
        name: string
        slug?: string
        parentId?: number | null
    }
    variants?: ProductVariantCreate[]
    createdAt?: string
    updatedAt?: string
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
    variantSize?:string
    size?:string
    sort?: 'newest' | 'price-asc' | 'price-desc' | 'name';
    page?: number;
    limit?: number;
}
export interface ProductUpdate{
    name?:string
    description?:string|null
    price?:number
    categoryId?:number
    isActive?:boolean
    variants?:ProductVariantUpdate[]


}
export type ProductUpdateVariantInput =
  | { id: number; size: string; name: string }
  | { size: string; name: string; initialStock: number };
  

