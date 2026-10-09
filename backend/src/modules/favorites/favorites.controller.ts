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
import { CreateFavoriteDto, UpdateFavoriteDto } from './dto/favorite.dto';
import { FavoritesService } from './favorites.service';

interface AuthenticatedRequest {
  user: { userId: number };
}

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() request: AuthenticatedRequest) {
    return this.favoritesService.findAllByUser(request.user.userId);
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  checkFavorite(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.checkIsFavorited(request.user.userId, productId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.findById(request.user.userId, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateFavoriteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.create(request.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoriteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.update(request.user.userId, id, dto);
  }

  @Delete('product/:productId')
  @UseGuards(JwtAuthGuard)
  removeByProductId(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.removeByProductId(request.user.userId, productId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.remove(request.user.userId, id);
  }
}
