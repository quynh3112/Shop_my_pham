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
	UploadedFile,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guard/optional-jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import type {
	ProductCreateInput,
	ProductQuery,
	ProductUpdateInput,
} from './dto/product.dto';
import { ProductService } from './product.service';

@RequirePermission('products')
@Controller('product')
export class 
ProductController {
	constructor(private readonly productService: ProductService) {}

	// Đăng nhập tuỳ chọn: có token thì sắp xếp "Dành cho bạn" dùng sở thích của khách
	@Get()
	@UseGuards(OptionalJwtAuthGuard)
	list(@Query() query: ProductQuery, @Req() request: { user?: { userId?: number } | null }) {
		return this.productService.listProducts(query, { userId: request.user?.userId });
	}



	// Đặt trước ':id' để không bị hiểu nhầm là id sản phẩm
	@Get('best-sellers')
	bestSellers(@Query('limit') limit?: string) {
		return this.productService.listBestSellers(limit);
	}

	@Get(':id')
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.productService.getProductById(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionGuard)
	create(@Body() input: ProductCreateInput, @Req() request: any) {
		return this.productService.createProduct(input, request.user.userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() input: ProductUpdateInput,
		@Req() request: any,
	) {
		return this.productService.updateProduct(id, input, request.user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	remove(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
		return this.productService.removeProduct(id, request.user.userId);
	}

	@Post(':id/images')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	@UseInterceptors(
		AnyFilesInterceptor({ limits: { fileSize: 5 * 1024 * 1024, files: 10 } }),
	)
	addImages(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFiles() files: Array<{ buffer: Buffer }>,
	) {
		return this.productService.addProductImages(id, files);
	}

	@Post(':id/description-pdf')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	@UseInterceptors(
		FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
	)
	uploadDescriptionPdf(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFile() file?: { buffer: Buffer; mimetype: string },
	) {
		return this.productService.setDescriptionPdf(id, file);
	}

	@Delete(':id/description-pdf')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	removeDescriptionPdf(@Param('id', ParseIntPipe) id: number) {
		return this.productService.removeDescriptionPdf(id);
	}

	@Delete('images/:imageId')
	@UseGuards(JwtAuthGuard, PermissionGuard)
	removeImage(@Param('imageId', ParseIntPipe) imageId: number) {
		return this.productService.removeProductImage(imageId);
	}
}
