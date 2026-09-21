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
  /** Tồn kho của đúng biến thể này, không phải tổng sản phẩm. */
  stock: number;
  /** false khi sản phẩm ngừng bán hoặc biến thể không còn đủ hàng. */
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
