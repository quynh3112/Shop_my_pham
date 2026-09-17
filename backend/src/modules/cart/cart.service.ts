import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from './entity/cart.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { CartItem } from '../cartitem/entity/cart_item.entity';
interface CartItemView {
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
const itemInclude = {
  variant: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          isActive: true,
          images: { select: { thumbUrl: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
  },
} as const;
function variantLabel(name: string, size: string, color: string) {
  return `${name} (${size}, ${color})`;
}
@Injectable()
export class CartService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(ProductVariant)private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>

  ) {}
  async ensureCart(userId:number):Promise<Cart>{
    const existing = await this.cartRepository.findOne({
      where: { userId },
      relations: {
        items: {
          variant: {
            product: {
              images: true,
            },
          },
        },
      },
    });
    if(existing){
      return existing;
    }
    const newCart=this.cartRepository.create({userId});
    return this.cartRepository.save(newCart);
  }
async getCart(userId:number):Promise<CartView>{
  const cart=await this.ensureCart(userId);
  const items=cart.items.map(item=>({
    id:item.id,
    variantId:item.variantId,
    productId:item.variant.productId,
    name:item.variant.product.name,
    slug:item.variant.product.slug,
    size:item.variant.size,
    color:item.variant.name,
    thumbUrl:item.variant.product.images[0]?.thumbUrl || null,
    unitPrice:item.variant.product.price,
    quantity:item.quantity,
    lineTotal:item.variant.product.price*item.quantity,
    stock:item.variant.stock,
    isAvailable:item.variant.product.isActive && item.variant.stock>=item.quantity
  }));
  const itemCount=items.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=items.reduce((sum,item)=>sum+item.lineTotal,0);
  const shippingFee=0;  

  const total=subtotal+shippingFee;
  const hasUnavailableItems=items.some(item=>!item.isAvailable);
  return {items,itemCount,subtotal,shippingFee,total,hasUnavailableItems};
}


async addItem(userId:number,variantId:number,quantity:number):Promise<CartView>{
  const variant=await this.variantRepository.findOne({where:{id:variantId, },relations:{product:true}});
  if(!variant|| !variant.product.isActive){
    throw new Error('Variant not found');
  }
  const label=variantLabel(variant.product.name,variant.size,variant.name);
  const cart =await this.ensureCart(userId);
  const existingItem=await this.itemRepo.findOne({where:{id:cart.id,variantId}});
  const nextQuantity=(existingItem?.quantity || 0)+quantity;
  if(nextQuantity>variant.stock){
     throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message:
          variant.stock === 0
            ? `"${label}" đã hết hàng.`
            : `"${label}" chỉ còn ${variant.stock} sản phẩm.`,
      });
  }
  if(existingItem){
    existingItem.quantity=nextQuantity;
    await this.itemRepo.save(existingItem);
  }
  else{
    const newItem=this.itemRepo.create({id:cart.id,variantId,quantity});
    await this.itemRepo.save(newItem);
  }
  return this.getCart(userId);


}
private async findOwnedItem(userId:number,itemId:number):Promise<CartItem>{
  const item=await this.itemRepo.findOne({where:{id:itemId},relations:{cart:true}});
  if(!item || item.cart.userId!==userId){
    throw new Error('Cart item not found');
  }
  return item;


}
async updateItem(userId:number,itemId:number,quantity:number):Promise<CartView>{
  const item=await this.findOwnedItem(userId, itemId)
  if(quantity>item.variant.stock){
    const label=variantLabel(item.variant.product.name,item.variant.size,item.variant.name);
    throw new ConflictException({
      code: 'INSUFFICIENT_STOCK',
      message:`"${label}" chỉ còn ${item.variant.stock} sản phẩm.`,
    });
  }
  item.quantity=quantity;
  await this.itemRepo.save(item);
  return this.getCart(userId);
}
async removeItem(userId:number, itemId:number):Promise<CartView>{
  await this.findOwnedItem(userId,itemId);
  await this.itemRepo.delete(itemId);
  return this.getCart(userId);
}
async clearCart(userId:number):Promise<CartView>{
  const cart=await this.ensureCart(userId);
  await this.itemRepo.delete({cartId:cart.id});
  return this.getCart(userId);
}}
