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

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@Req() request: { user: { userId: number } }) {
    return this.favoritesService.findAll(request.user.userId);
  }

  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { user: { userId: number } },
  ) {
    return this.favoritesService.findById(request.user.userId, id);
  }

  @Post()
  create(
    @Body() data: CreateFavoriteDto,
    @Req() request: { user: { userId: number } },
  ) {
    return this.favoritesService.create(request.user.userId, data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateFavoriteDto,
    @Req() request: { user: { userId: number } },
  ) {
    return this.favoritesService.update(request.user.userId, id, data);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { user: { userId: number } },
  ) {
    return this.favoritesService.remove(request.user.userId, id);
  }
}
