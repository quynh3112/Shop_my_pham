import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { CartService } from './cart.service';

interface AddCartItemBody {
	variantId: number;
	quantity: number;
}

interface UpdateCartItemBody {
	quantity: number;
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
	constructor(private readonly cartService: CartService) {}

	@Get()
	getCart(@Req() request: any) {
		return this.cartService.getCart(request.user.userId);
	}

	@Get('count')
	getCartCount(@Req() request: any) {
		return this.cartService.getCartCount(request.user.userId);
	}

	@Post('items')
	addItem(@Body() body: AddCartItemBody, @Req() request: any) {
		return this.cartService.addItem(
			request.user.userId,
			body.variantId,
			body.quantity,
		);
	}

	@Patch('items/:itemId')
	updateItem(
		@Param('itemId', ParseIntPipe) itemId: number,
		@Body() body: UpdateCartItemBody,
		@Req() request: any,
	) {
		return this.cartService.updateItem(
			request.user.userId,
			itemId,
			body.quantity,
		);
	}

	@Delete('items/:itemId')
	removeItem(
		@Param('itemId', ParseIntPipe) itemId: number,
		@Req() request: any,
	) {
		return this.cartService.removeItem(request.user.userId, itemId);
	}

	@Delete()
	clearCart(@Req() request: any) {
		return this.cartService.clearCart(request.user.userId);
	}
}
