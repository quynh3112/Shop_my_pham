import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import { OrderStatus } from 'src/until/order_status';
import { Favorite } from '../favorites/entity/favorite.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { Review } from '../reviews/entity/review.entity';
import { SkinAnalysis } from '../skin-analysis/entity/skin-analysis.entity';
import { SKIN_CONCERNS, SKIN_TYPES, type SkinConcern, type SkinType } from '../skin-analysis/skin.constants';
import { Product } from './entity/product.entity';

/**
 * Điểm "Dành cho bạn" — chỉnh trọng số ở đây.
 * Sở thích lấy từ dữ liệu sẵn có: phân tích da gần nhất, yêu thích, đã mua, đánh giá.
 */
const WEIGHT = {
  concernMatch: 3, // mỗi vấn đề da (lần phân tích gần nhất) sản phẩm xử lý được
  skinTypeMatch: 2, // hợp loại da
  favoriteCategory: 2, // cùng danh mục với sản phẩm đã yêu thích
  purchasedCategory: 1.5, // cùng danh mục với sản phẩm đã mua
  favoritedItself: 1, // chính sản phẩm đã yêu thích nhưng chưa mua
  alreadyPurchased: -2, // đã mua rồi -> ưu tiên gợi ý thứ mới
  disliked: -10, // đã đánh giá 1-2 sao
  popularity: 0.5, // x ln(1 + số lượng đã bán)
  rating: 0.3, // x điểm đánh giá trung bình
};

export interface PreferenceProfile {
  skinType?: SkinType;
  concerns: SkinConcern[];
  favoriteProductIds: number[];
  favoriteCategoryIds: number[];
  purchasedProductIds: number[];
  purchasedCategoryIds: number[];
  dislikedProductIds: number[];
}

const EMPTY_PROFILE: PreferenceProfile = {
  concerns: [],
  favoriteProductIds: [],
  favoriteCategoryIds: [],
  purchasedProductIds: [],
  purchasedCategoryIds: [],
  dislikedProductIds: [],
};

@Injectable()
export class RecommendationService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Hồ sơ sở thích của khách; khách vãng lai / chưa có dữ liệu -> hồ sơ rỗng (chỉ xếp theo độ phổ biến) */
  async buildProfile(userId?: number): Promise<PreferenceProfile> {
    if (!userId) return EMPTY_PROFILE;

    const [latestSkin, favorites, purchased, disliked] = await Promise.all([
      this.dataSource.getRepository(SkinAnalysis).findOne({
        where: { userId },
        select: ['id', 'skinType', 'concerns'],
        order: { createdAt: 'DESC' },
      }),
      this.dataSource.getRepository(Favorite).find({ where: { userId }, select: ['productId'] }),
      this.dataSource
        .getRepository(OrderItem)
        .createQueryBuilder('item')
        .innerJoin('item.order', 'o')
        .select('DISTINCT item.productId', 'productId')
        .where('o.userId = :userId', { userId })
        .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
        .andWhere('item.productId IS NOT NULL')
        .getRawMany<{ productId: number }>(),
      this.dataSource
        .getRepository(Review)
        .find({ where: { userId }, select: ['productId', 'rating'] })
        .then((reviews) => reviews.filter((review) => review.rating <= 2)),
    ]);

    const favoriteProductIds = favorites.map((favorite) => favorite.productId);
    const purchasedProductIds = purchased.map((row) => Number(row.productId));
    const knownIds = [...new Set([...favoriteProductIds, ...purchasedProductIds])];
    const categoryOf = new Map<number, number>();
    if (knownIds.length) {
      const products = await this.dataSource
        .getRepository(Product)
        .find({ where: { id: In(knownIds) }, select: ['id', 'categoryId'] });
      products.forEach((product) => categoryOf.set(product.id, product.categoryId));
    }
    const categoriesOf = (ids: number[]) =>
      [...new Set(ids.map((id) => categoryOf.get(id)).filter((id): id is number => id !== undefined))];

    return {
      skinType: latestSkin?.skinType,
      concerns: latestSkin?.concerns ?? [],
      favoriteProductIds,
      favoriteCategoryIds: categoriesOf(favoriteProductIds),
      purchasedProductIds,
      purchasedCategoryIds: categoriesOf(purchasedProductIds),
      dislikedProductIds: disliked.map((review) => review.productId),
    };
  }

  /** Thêm cột điểm "Dành cho bạn" (tính trong DB) và sắp xếp theo điểm, dùng chung với mọi bộ lọc */
  applyScore(qb: SelectQueryBuilder<Product>, profile: PreferenceProfile) {
    const parts: string[] = [];
    const params: Record<string, unknown> = {};

    if (profile.concerns.length) {
      parts.push(
        `${WEIGHT.concernMatch} * cardinality(ARRAY(SELECT unnest(product.concerns) INTERSECT SELECT unnest(ARRAY[:...recConcerns]::text[])))`,
      );
      params.recConcerns = profile.concerns;
    }
    if (profile.skinType) {
      parts.push(`CASE WHEN :recSkinType = ANY(product.skinTypes) THEN ${WEIGHT.skinTypeMatch} ELSE 0 END`);
      params.recSkinType = profile.skinType;
    }
    const addIdTerm = (column: string, ids: number[], weight: number, param: string) => {
      if (!ids.length) return;
      parts.push(`CASE WHEN ${column} IN (:...${param}) THEN ${weight} ELSE 0 END`);
      params[param] = ids;
    };
    addIdTerm('product.categoryId', profile.favoriteCategoryIds, WEIGHT.favoriteCategory, 'recFavCats');
    addIdTerm('product.categoryId', profile.purchasedCategoryIds, WEIGHT.purchasedCategory, 'recBoughtCats');
    addIdTerm('product.id', profile.favoriteProductIds, WEIGHT.favoritedItself, 'recFavIds');
    addIdTerm('product.id', profile.purchasedProductIds, WEIGHT.alreadyPurchased, 'recBoughtIds');
    addIdTerm('product.id', profile.dislikedProductIds, WEIGHT.disliked, 'recDislikedIds');

    // Độ phổ biến: ai cũng có, nên khách mới / chưa có dữ liệu vẫn thấy hàng bán chạy, đánh giá tốt trước
    qb.leftJoin(
      (sub) =>
        sub
          .from(OrderItem, 'ri')
          .innerJoin('ri.order', 'ro')
          .select('ri.productId', 'product_id')
          .addSelect('SUM(ri.quantity)', 'sold')
          .where('ro.status != :recCancelled')
          .groupBy('ri.productId'),
      'rec_sales',
      'rec_sales.product_id = product.id',
    )
      .leftJoin(
        (sub) =>
          sub
            .from(Review, 'rr')
            .select('rr.productId', 'product_id')
            .addSelect('AVG(rr.rating)', 'avg_rating')
            .groupBy('rr.productId'),
        'rec_ratings',
        'rec_ratings.product_id = product.id',
      )
      .setParameter('recCancelled', OrderStatus.CANCELLED);
    parts.push(`${WEIGHT.popularity} * LN(1 + COALESCE(rec_sales.sold, 0))`);
    parts.push(`${WEIGHT.rating} * COALESCE(rec_ratings.avg_rating, 0)`);

    qb.addSelect(parts.join(' + '), 'rec_score').setParameters(params).orderBy('rec_score', 'DESC');
  }

  /** Lý do gợi ý ngắn gọn cho từng sản phẩm (hiện dưới thẻ sản phẩm) */
  reasonsFor(product: Pick<Product, 'id' | 'categoryId' | 'concerns' | 'skinTypes'>, profile: PreferenceProfile) {
    const reasons: string[] = [];
    const matched = (product.concerns ?? []).filter((concern) => profile.concerns.includes(concern as SkinConcern));
    matched.forEach((concern) => reasons.push(SKIN_CONCERNS[concern as SkinConcern]));
    if (profile.skinType && (product.skinTypes ?? []).includes(profile.skinType)) {
      reasons.push(`Hợp ${SKIN_TYPES[profile.skinType].toLowerCase()}`);
    }
    if (profile.favoriteProductIds.includes(product.id)) reasons.push('Bạn đã yêu thích');
    else if (profile.favoriteCategoryIds.includes(product.categoryId)) reasons.push('Cùng loại sản phẩm bạn yêu thích');
    if (!profile.purchasedProductIds.includes(product.id) && profile.purchasedCategoryIds.includes(product.categoryId)) {
      reasons.push('Cùng loại sản phẩm bạn đã mua');
    }
    return reasons.slice(0, 3);
  }
}
