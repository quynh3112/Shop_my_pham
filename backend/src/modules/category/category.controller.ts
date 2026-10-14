import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@RequirePermission('categories')
@Controller('category')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class CategoryController {
    constructor(private readonly categoryService:CategoryService){}

    @Get('/')
    listCategory(){
        return this.categoryService.listCategoryTree()
    }

    // Thêm / sửa / xoá danh mục: chỉ admin
    @Post('/')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    creat(@Body() data:CreateCategoryDto){
        return this.categoryService.create(data)
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCategoryDto){
        return this.categoryService.updateCategory(id, data)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    remove(@Param('id', ParseIntPipe) id: number){
        return this.categoryService.removeCategory(id)
    }
}
