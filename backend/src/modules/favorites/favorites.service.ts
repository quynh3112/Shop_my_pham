import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { Review } from '../reviews/entity/review.entity';
import { User } from '../user/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateFavoriteDto, UpdateFavoriteDto } from './dto/favorite.dto';
import { Favorite } from './entity/favorite.entity';

type FavoriteWithProductStats = Favorite & {
  product: Product & {
    averageRating: number;
    reviewCount: number;
  };
};

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  private async attachProductRating(
    favorite: Favorite,
  ): Promise<FavoriteWithProductStats> {
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.productId = :productId', { productId: favorite.productId })
      .getRawOne<{ averageRating: string | null; reviewCount: string }>();

    const averageRating = stats?.averageRating
      ? Number(stats.averageRating)
      : 0;
    const reviewCount = Number(stats?.reviewCount ?? 0);

    return {
      ...favorite,
      product: {
        ...(favorite.product as Product),
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount,
      },
    } as FavoriteWithProductStats;
  }

  private async attachProductRatings(
    favorites: Favorite[],
  ): Promise<FavoriteWithProductStats[]> {
    if (favorites.length === 0) {
      return [];
    }

    const productIds = favorites.map((favorite) => favorite.productId);
    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.productId', 'productId')
      .addSelect('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.productId IN (:...productIds)', { productIds })
      .groupBy('review.productId')
      .getRawMany<{
        productId: number;
        averageRating: string | null;
        reviewCount: string;
      }>();

    const ratingMap = new Map<number, { averageRating: number; reviewCount: number }>();
    for (const row of rows) {
      ratingMap.set(Number(row.productId), {
        averageRating: row.averageRating ? Number(Number(row.averageRating).toFixed(1)) : 0,
        reviewCount: Number(row.reviewCount ?? 0),
      });
    }

    return favorites.map((favorite) => ({
      ...favorite,
      product: {
        ...(favorite.product as Product),
        averageRating: ratingMap.get(favorite.productId)?.averageRating ?? 0,
        reviewCount: ratingMap.get(favorite.productId)?.reviewCount ?? 0,
      },
    })) as FavoriteWithProductStats[];
  }

  async findAllByUser(userId: number): Promise<FavoriteWithProductStats[]> {
    const favorites = await this.favoriteRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });

    return this.attachProductRatings(favorites);
  }

  async findById(userId: number, id: number): Promise<FavoriteWithProductStats> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
      relations: ['product'],
    });

    if (!favorite) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong danh sách yêu thích.');
    }

    return this.attachProductRating(favorite);
  }

  async create(userId: number, dto: CreateFavoriteDto): Promise<Favorite> {
    const [user, product] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.productRepo.findOne({ where: { id: dto.productId } }),
    ]);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }

    const existingFavorite = await this.favoriteRepo.findOne({
      where: { userId, productId: dto.productId },
    });

    if (existingFavorite) {
      throw new ConflictException('Sản phẩm này đã có trong danh sách yêu thích.');
    }

    const favorite = this.favoriteRepo.create({
      userId,
      productId: dto.productId,
    });

    const savedFavorite = await this.favoriteRepo.save(favorite);
    return this.findById(userId, savedFavorite.id);
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateFavoriteDto,
  ): Promise<Favorite> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
      relations: ['product'],
    });

    if (!favorite) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong danh sách yêu thích.');
    }

    if (dto.productId === undefined) {
      return favorite;
    }

    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }

    const existingFavorite = await this.favoriteRepo.findOne({
      where: { userId, productId: dto.productId },
    });

    if (existingFavorite && existingFavorite.id !== id) {
      throw new ConflictException('Sản phẩm này đã có trong danh sách yêu thích.');
    }

    favorite.productId = dto.productId;
    const savedFavorite = await this.favoriteRepo.save(favorite);
    return this.findById(userId, savedFavorite.id);
  }

  async remove(userId: number, id: number): Promise<{ deleted: boolean; id: number }> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong danh sách yêu thích.');
    }

    await this.favoriteRepo.remove(favorite);
    return { deleted: true, id };
  }

  async removeByProductId(
    userId: number,
    productId: number,
  ): Promise<{ deleted: boolean; productId: number }> {
    const favorite = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Sản phẩm không nằm trong danh sách yêu thích.');
    }

    await this.favoriteRepo.remove(favorite);
    return { deleted: true, productId };
  }

  async checkIsFavorited(
    userId: number,
    productId: number,
  ): Promise<{ productId: number; isFavorite: boolean }> {
    const favorite = await this.favoriteRepo.findOne({
      where: { userId, productId },
      select: ['id'],
    });

    return {
      productId,
      isFavorite: !!favorite,
    };
  }

  async isFavorite(userId: number, productId: number): Promise<boolean> {
    const result = await this.checkIsFavorited(userId, productId);
    return result.isFavorite;
  }
}
