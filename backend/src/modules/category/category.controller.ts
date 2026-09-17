import { Body, Controller, Post,Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/category.dto';

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService:CategoryService){}
    @Post('/')
    creat(@Body() data:CreateCategoryDto){
        return this.categoryService.create(data)

    }
    @Get('/')
    listCategory(){
        return this.categoryService.listCategoryTree()

    }
}
