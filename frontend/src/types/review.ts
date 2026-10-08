export interface ReviewCreate {
    id?: number;
    productId: number;
    rating: number;
    comment: string;
}

export interface ReviewView {
    id: number;
    productId: number;
    rating: number;
    comment: string;
}