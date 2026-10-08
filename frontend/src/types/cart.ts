export interface CartItemView {
  id: number;
  variantId: number;
  productId: number;
  name: string;
  slug: string;
  size: string;
  color: string;
  thumbUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  isAvailable: boolean;}
  
export interface CartView {
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  hasUnavailableItems: boolean;
}
export interface AddCartItemBody {
	variantId: number;
	quantity: number;
}

export interface UpdateCartItemBody {
	quantity: number;
}
