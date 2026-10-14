import type { ProductItem } from "./product";

export interface FavoriteCreate {
    productId: number;
}
export interface FavoriteView{
    id: number;
    productId: number;
    createdAt?: string;
    product?: ProductItem & { averageRating?: number; reviewCount?: number };
}
