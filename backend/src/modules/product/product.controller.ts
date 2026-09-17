import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import type {
	ProductCreateInput,
	ProductQuery,
	ProductUpdateInput,
} from './dto/product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	list(@Query() query: ProductQuery) {
		return this.productService.listProducts(query);
	}

	@Get(':id')
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.productService.getProductById(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Body() input: ProductCreateInput, @Req() request: any) {
		return this.productService.createProduct(input, request.user.userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() input: ProductUpdateInput,
		@Req() request: any,
	) {
		return this.productService.updateProduct(id, input, request.user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	remove(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
		return this.productService.removeProduct(id, request.user.userId);
	}

	@Post(':id/images')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(AnyFilesInterceptor())
	addImages(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFiles() files: Array<{ buffer: Buffer }>,
	) {
		return this.productService.addProductImages(id, files);
	}

	@Delete('images/:imageId')
	@UseGuards(JwtAuthGuard)
	removeImage(@Param('imageId', ParseIntPipe) imageId: number) {
		return this.productService.removeProductImage(imageId);
	}
}
