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
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

interface AuthenticatedRequest {
  user: { userId: number };
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}



  @Get('product/:productId')
  findByProductId(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.reviewsService.findByProductId(productId);
  }

  @Get('pending-products')
  @UseGuards(JwtAuthGuard)
  findPurchasedProductsNotReviewed(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.findPurchasedProductsNotReviewed(
      request.user.userId,
    );
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.create(request.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.update(request.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.remove(request.user.userId, id);
  }
}
