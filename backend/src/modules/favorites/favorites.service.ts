import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entity/product.entity';
import { CreateFavoriteDto, UpdateFavoriteDto } from './dto/favorite.dto';
import { Favorite } from './entity/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(userId: number): Promise<Favorite[]> {
    return this.favoriteRepo.find({
      where: { userId },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(userId: number, id: number): Promise<Favorite> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
      relations: { product: true },
    });

    if (!favorite) {
      throw new NotFoundException('Không tìm thấy sản phẩm yêu thích.');
    }

    return favorite;
  }

  async create(userId: number, data: CreateFavoriteDto): Promise<Favorite> {
    await this.assertProductExists(data.productId);

    const existing = await this.favoriteRepo.findOne({
      where: { userId, productId: data.productId },
    });
    if (existing) {
      throw new ConflictException('Sản phẩm đã có trong danh sách yêu thích.');
    }

    const favorite = this.favoriteRepo.create({
      userId,
      productId: data.productId,
    });
    return this.favoriteRepo.save(favorite);
  }

  async update(
    userId: number,
    id: number,
    data: UpdateFavoriteDto,
  ): Promise<Favorite> {
    const favorite = await this.findById(userId, id);

    if (data.productId !== undefined && data.productId !== favorite.productId) {
      await this.assertProductExists(data.productId);

      const existing = await this.favoriteRepo.findOne({
        where: { userId, productId: data.productId },
      });
      if (existing) {
        throw new ConflictException(
          'Sản phẩm đã có trong danh sách yêu thích.',
        );
      }

      favorite.productId = data.productId;
    }

    return this.favoriteRepo.save(favorite);
  }

  async remove(
    userId: number,
    id: number,
  ): Promise<{ deleted: true; id: number }> {
    const favorite = await this.findById(userId, id);
    await this.favoriteRepo.remove(favorite);
    return { deleted: true, id };
  }

  private async assertProductExists(productId: number): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }
  }
}
