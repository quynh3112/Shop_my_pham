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
import { RoleGuard } from '../guard/role.guard';
import type {
	ProductCreateInput,
	ProductQuery,
	ProductUpdateInput,
} from './dto/product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class 
ProductController {
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
	@UseGuards(JwtAuthGuard, RoleGuard)
	create(@Body() input: ProductCreateInput, @Req() request: any) {
		return this.productService.createProduct(input, request.user.userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RoleGuard)
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() input: ProductUpdateInput,
		@Req() request: any,
	) {
		return this.productService.updateProduct(id, input, request.user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, RoleGuard)
	remove(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
		return this.productService.removeProduct(id, request.user.userId);
	}

	@Post(':id/images')
	@UseGuards(JwtAuthGuard, RoleGuard)
	@UseInterceptors(AnyFilesInterceptor())
	addImages(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFiles() files: Array<{ buffer: Buffer }>,
	) {
		return this.productService.addProductImages(id, files);
	}

	@Post(':id/description-pdf')
	@UseGuards(JwtAuthGuard, RoleGuard)
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
	@UseGuards(JwtAuthGuard, RoleGuard)
	removeDescriptionPdf(@Param('id', ParseIntPipe) id: number) {
		return this.productService.removeDescriptionPdf(id);
	}

	@Delete('images/:imageId')
	@UseGuards(JwtAuthGuard, RoleGuard)
	removeImage(@Param('imageId', ParseIntPipe) imageId: number) {
		return this.productService.removeProductImage(imageId);
	}
}
