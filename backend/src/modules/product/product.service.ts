import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { EntityManager, In, Not, Repository } from 'typeorm';
import { ProductImage } from '../productimage/entity/product_image.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { CategoryService } from '../category/category.service';
import { Favorite } from '../favorites/entity/favorite.entity';
import { DataSource } from 'typeorm';
import { Category } from '../category/entity/category.entity';
import {
  ProductCreateInput,
  ProductQuery,
  ProductUpdateInput,
  ProductUpdateVariantInput,
} from './dto/product.dto';
import { uniqueSlug } from 'src/until/slug';
import { OrderStatus } from 'src/until/order_status';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { PreferenceProfile, RecommendationService } from './recommendation.service';
import { Review } from '../reviews/entity/review.entity';
import { pickSkinConcerns, pickSkinTypes } from '../skin-analysis/skin.constants';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';

type UploadedImage = { buffer: Buffer };
type UploadedPdf = { buffer: Buffer; mimetype?: string };

const productImageDirectory = join(process.cwd(), 'uploads', 'products');

// Nhận diện ảnh theo vài byte đầu file, không tin vào tên / mimetype trình duyệt gửi lên
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 6).toString('latin1').startsWith('GIF8')) return 'gif';
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

async function storeProductImage(buffer: Buffer) {
  const extension = detectImageExtension(buffer);
  if (!extension) {
    throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
  }
  await mkdir(productImageDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(join(productImageDirectory, filename), buffer);
  const url = `/uploads/products/${filename}`;
  return { url, thumbUrl: url };
}

async function deleteStoredImage(image: ProductImage) {
  const filename = basename(image.url);
  try {
    await unlink(join(productImageDirectory, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

const productDocumentDirectory = join(process.cwd(), 'uploads', 'documents');

async function storeDescriptionPdf(buffer: Buffer) {
  await mkdir(productDocumentDirectory, { recursive: true });
  const filename = `${randomUUID()}.pdf`;
  await writeFile(join(productDocumentDirectory, filename), buffer);
  return `/uploads/documents/${filename}`;
}

async function deleteStoredPdf(url: string | null) {
  if (!url) return;
  try {
    await unlink(join(productDocumentDirectory, basename(url)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function sumStock(variants: { stock: number }[]) {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}
function toSummary<T extends { variants: { stock: number }[] }>(product: T) {
  const { variants, ...rest } = product;
  return { ...rest, stock: sumStock(variants) };
}
function toDetail<T extends { variants: { stock: number }[] }>(product: T) {
  return { ...product, stock: sumStock(product.variants) };
}

/** Thứ tự dung tích quen mắt cho mỹ phẩm: số nhỏ -> lớn, đơn vị ml/g. */
function sizeSortKey(size: string | null): [number, number | string] {
  if (size === null) return [2, ''];
  const numeric = parseFloat(size);
  if (Number.isFinite(numeric)) return [0, numeric];
  return [1, size];
}
// function compareSizes(a: string | null, b: string | null) {
//   const [groupA, valueA] = sizeSortKey(a);
//   const [groupB, valueB] = sizeSortKey(b);
//   if (groupA !== groupB) return groupA - groupB;
//   if (typeof valueA === 'number' && typeof valueB === 'number') return valueA - valueB;
//   return String(valueA).localeCompare(String(valueB), 'vi');
// }

@Injectable()
export class ProductService implements OnModuleInit {
  private readonly logger = new Logger(ProductService.name);
  /** Có extension unaccent thì tìm kiếm bỏ qua dấu tiếng Việt */
  private hasUnaccent = false;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(ProductImage)
    private readonly imgRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly categoryService: CategoryService,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryMovementService,
    private readonly recommendation: RecommendationService,
  ) {}
  async onModuleInit() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS unaccent');
      this.hasUnaccent = true;
    } catch (error) {
      this.logger.warn(
        `Không bật được extension unaccent, tìm kiếm sẽ phân biệt dấu: ${(error as Error).message}`,
      );
    }
  }
  private async slugIsTaken(slug: string, exceptId?: number) {
    const found = await this.productRepo.findOne({
      where: { slug },
      select: ['id'],
    });
    return found !== null && found.id !== exceptId;
  }
  private async assertCategoryExists(categoryId: number) {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
      select: ['id'],
    });
    if (!category) {
      throw new BadRequestException('Danh mục được chọn không tồn tại.');
    }
  }
  async listProducts(
    rawQuery: ProductQuery,
    options?: { includeInactive?: boolean; userId?: number },
  ) {
    // Query string chưa qua ValidationPipe: giá trị là chuỗi hoặc thiếu hẳn
    const toNumber = (value: unknown) =>
      value === undefined || value === '' || !Number.isFinite(Number(value))
        ? undefined
        : Number(value);
    // "oily,dry" hoặc ["oily", "dry"] đều thành mảng mã
    const toList = (value: unknown) =>
      (Array.isArray(value) ? value : typeof value === 'string' ? [value] : [])
        .flatMap((v) => String(v).split(','))
        .map((v) => v.trim())
        .filter(Boolean);
    const page = Math.max(1, Math.floor(toNumber(rawQuery.page) ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(toNumber(rawQuery.limit) ?? 20)));
    const search = typeof rawQuery.search === 'string' ? rawQuery.search.trim() : '';
    const categoryId = toNumber(rawQuery.categoryId);
    const minPrice = toNumber(rawQuery.minPrice);
    const maxPrice = toNumber(rawQuery.maxPrice);
    const minRating = toNumber(rawQuery.minRating);
    const skinTypes = pickSkinTypes(toList(rawQuery.skinTypes));
    const concerns = pickSkinConcerns(toList(rawQuery.concerns));
    const inStock = rawQuery.inStock === true || rawQuery.inStock === 'true';
    // Không chọn cách sắp xếp: đang tìm từ khoá thì ưu tiên độ liên quan
    const sort = rawQuery.sort ?? (search ? 'relevance' : 'newest');

    // Chỉ join category (many-to-one) nên mỗi sản phẩm đúng 1 dòng, phân trang
    // trực tiếp được; biến thể / ảnh load sau theo id của trang hiện tại.
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category');
    if (options?.includeInactive !== true) {
      qb.andWhere('product.isActive = true');
    }

    // Tìm không phân biệt hoa thường / dấu ("kem chong nang" ra "Kem chống nắng"),
    // trên tên, mô tả và tên danh mục. Mỗi từ phải xuất hiện ở ít nhất một chỗ.
    const fold = (expr: string) => (this.hasUnaccent ? `unaccent(${expr})` : expr);
    const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
    const words = search.split(/\s+/).filter(Boolean).slice(0, 8);
    words.forEach((word, i) => {
      const param = fold(`:word${i}`);
      qb.andWhere(
        `(${fold('product.name')} ILIKE ${param}` +
          ` OR ${fold('product.description')} ILIKE ${param}` +
          ` OR ${fold('category.name')} ILIKE ${param})`,
        { [`word${i}`]: `%${escapeLike(word)}%` },
      );
    });

    if (categoryId !== undefined) {
      const categoryIds = await this.categoryService.descendantCategoryIds(categoryId);
      qb.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
    }
    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }
    // Sản phẩm hợp với ít nhất một loại da / vấn đề da được chọn
    if (skinTypes.length > 0) {
      qb.andWhere('product.skinTypes && ARRAY[:...skinTypes]::text[]', { skinTypes });
    }
    if (concerns.length > 0) {
      qb.andWhere('product.concerns && ARRAY[:...concerns]::text[]', { concerns });
    }
    if (minRating !== undefined) {
      const ratingSub = this.dataSource
        .getRepository(Review)
        .createQueryBuilder('r')
        .select('r.productId')
        .groupBy('r.productId')
        .having('AVG(r.rating) >= :minRating', { minRating });
      qb.andWhere(`product.id IN (${ratingSub.getQuery()})`).setParameters(
        ratingSub.getParameters(),
      );
    }
    // Lọc theo tên biến thể (tông màu/loại) và dung tích, kèm điều kiện CÒN
    // HÀNG: khách lọc "Shade 01" để tìm hàng mua được ngay.
    if (inStock || rawQuery.variantName || rawQuery.size) {
      const sub = this.variantRepo
        .createQueryBuilder('v')
        .select('v.productId')
        .where('v.stock > 0');
      if (rawQuery.variantName) {
        sub.andWhere('v.name = :variantName', { variantName: rawQuery.variantName });
      }
      if (rawQuery.size) {
        sub.andWhere('v.size = :size', { size: rawQuery.size });
      }
      qb.andWhere(`product.id IN (${sub.getQuery()})`).setParameters(
        sub.getParameters(),
      );
    }

    const total = await qb.getCount();
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
    if (total === 0) return { items: [], pagination };

    const idQb = qb.clone().select('product.id', 'id');
    let recommendationProfile: PreferenceProfile | undefined;
    switch (sort) {
      case 'price-asc':
        idQb.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        idQb.orderBy('product.price', 'DESC');
        break;
      case 'name':
        idQb.orderBy('product.name', 'ASC');
        break;
      case 'best-selling':
        idQb
          .leftJoin(
            (sub) =>
              sub
                .from(OrderItem, 'item')
                .innerJoin('item.order', 'o')
                .select('item.productId', 'product_id')
                .addSelect('SUM(item.quantity)', 'sold')
                .where('o.status != :cancelled')
                .groupBy('item.productId'),
            'sales',
            'sales.product_id = product.id',
          )
          .setParameter('cancelled', OrderStatus.CANCELLED)
          .addSelect('COALESCE(sales.sold, 0)', 'sold')
          .orderBy('sold', 'DESC');
        break;
      case 'rating':
        idQb
          .leftJoin(
            (sub) =>
              sub
                .from(Review, 'r')
                .select('r.productId', 'product_id')
                .addSelect('AVG(r.rating)', 'avg_rating')
                .addSelect('COUNT(r.id)', 'review_count')
                .groupBy('r.productId'),
            'ratings',
            'ratings.product_id = product.id',
          )
          .addSelect('COALESCE(ratings.avg_rating, 0)', 'avg_rating')
          .addSelect('COALESCE(ratings.review_count, 0)', 'review_count')
          .orderBy('avg_rating', 'DESC')
          .addOrderBy('review_count', 'DESC');
        break;
      case 'for-you':
        recommendationProfile = await this.recommendation.buildProfile(options?.userId);
        this.recommendation.applyScore(idQb, recommendationProfile);
        break;
      case 'relevance':
        // Khớp nguyên cụm trong tên > tên chứa đủ các từ > chỉ khớp mô tả/danh mục
        if (words.length > 0) {
          const nameHasAllWords = words
            .map((_, i) => `${fold('product.name')} ILIKE ${fold(`:word${i}`)}`)
            .join(' AND ');
          idQb
            .addSelect(
              `CASE WHEN ${fold('product.name')} ILIKE ${fold(':phrase')} THEN 0` +
                ` WHEN ${nameHasAllWords} THEN 1 ELSE 2 END`,
              'relevance',
            )
            .setParameter('phrase', `%${escapeLike(words.join(' '))}%`)
            .orderBy('relevance', 'ASC');
        }
        break;
    }
    // Cùng hạng thì sản phẩm mới hơn lên trước; id giữ thứ tự ổn định giữa các trang
    idQb.addOrderBy('product.createdAt', 'DESC').addOrderBy('product.id', 'DESC');

    const idRows = await idQb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: number }>();
    const pageIds = idRows.map((r) => Number(r.id));
    if (pageIds.length === 0) return { items: [], pagination };

    const items = await this.productRepo.find({
      where: { id: In(pageIds) },
      relations: ['category', 'variants', 'images'],
    });
    const byId = new Map(items.map((p) => [p.id, p]));
    const ordered = pageIds.map((id) => byId.get(id)!);

    const summaries = await this.withRatings(ordered.map(toSummary));
    return {
      // "Dành cho bạn": kèm lý do gợi ý để khách hiểu vì sao sản phẩm được đưa lên
      items: recommendationProfile
        ? summaries.map((product) => ({
            ...product,
            recommendReasons: this.recommendation.reasonsFor(product, recommendationProfile),
          }))
        : summaries,
      pagination,
    };
  }
  /**
   * Sản phẩm bán chạy: cộng số lượng đã bán từ các đơn chưa bị huỷ.
   * Chưa đủ số lượng (shop mới, ít đơn) thì bù bằng sản phẩm mới nhất.
   */
  async listBestSellers(rawLimit?: unknown) {
    const limit = Math.min(24, Math.max(1, Math.floor(Number(rawLimit) || 12)));

    const soldRows = await this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .select('item.productId', 'productId')
      .addSelect('SUM(item.quantity)', 'sold')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('product.isActive = true')
      .groupBy('item.productId')
      .orderBy('sold', 'DESC')
      .limit(limit)
      .getRawMany<{ productId: number; sold: string }>();

    const soldById = new Map(soldRows.map((row) => [Number(row.productId), Number(row.sold)]));
    const ids = [...soldById.keys()];

    if (ids.length < limit) {
      const newest = await this.productRepo.find({
        where: { isActive: true, ...(ids.length ? { id: Not(In(ids)) } : {}) },
        select: ['id'],
        order: { createdAt: 'DESC' },
        take: limit - ids.length,
      });
      ids.push(...newest.map((product) => product.id));
    }
    if (ids.length === 0) return [];

    const products = await this.productRepo.find({
      where: { id: In(ids) },
      relations: ['category', 'variants', 'images'],
      order: { images: { sortOrder: 'ASC' } },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product))
      .map((product) => ({ ...toSummary(product), sold: soldById.get(product.id) ?? 0 }));
  }

  /** Gắn điểm đánh giá trung bình + số lượt đánh giá cho danh sách sản phẩm (1 truy vấn) */
  private async withRatings<T extends { id: number }>(products: T[]) {
    if (products.length === 0) return [] as (T & { averageRating: number; reviewCount: number })[];
    const rows = await this.dataSource
      .getRepository(Review)
      .createQueryBuilder('r')
      .select('r.productId', 'productId')
      .addSelect('AVG(r.rating)', 'averageRating')
      .addSelect('COUNT(r.id)', 'reviewCount')
      .where('r.productId IN (:...ids)', { ids: products.map((product) => product.id) })
      .groupBy('r.productId')
      .getRawMany<{ productId: number; averageRating: string | null; reviewCount: string }>();
    const byId = new Map(rows.map((row) => [Number(row.productId), row]));
    return products.map((product) => {
      const row = byId.get(product.id);
      return {
        ...product,
        averageRating: row?.averageRating ? Number(Number(row.averageRating).toFixed(1)) : 0,
        reviewCount: Number(row?.reviewCount ?? 0),
      };
    });
  }

  private async lockProductRow(manager: EntityManager, productId: number) {
    const rows = await manager.query(
      'SELECT id FROM products WHERE id = $1 FOR UPDATE',
      [productId],
    );
    if (rows.length === 0)
      throw new NotFoundException('Không tìm thấy sản phẩm này.');
  }

  async getProductById(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'variants', 'images'],
      order: { images: { sortOrder: 'ASC' }, variants: { id: 'ASC' } },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này.');
    const [detail] = await this.withRatings([toDetail(product)]);
    return detail;
  }
  async createProduct(input: ProductCreateInput, adminUserId: number) {
    await this.assertCategoryExists(input.categoryId);

    const createdId = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Product, {
        name: input.name,
        slug: await uniqueSlug(input.name, (slug) => this.slugIsTaken(slug)),
        description: input.description ?? '',
        price: input.price,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        skinTypes: pickSkinTypes(input.skinTypes),
        concerns: pickSkinConcerns(input.concerns),
      });
      const saved = await manager.save(created);

      for (const variant of input.variants) {
        await this.inventoryService.createVariantWithInitialStock(manager, {
          productId: saved.id,
          productName: saved.name,
          name: variant.name,
          size: variant.size ?? null,
          initialStock: variant.initialStock,
          actor: { type: 'ADMIN' as any, userId: adminUserId },
        });
      }

      return saved.id;
    });

    return this.getProductById(createdId);
  }
  private async replaceVariants(
    manager: EntityManager,
    productId: number,
    productName: string,
    variants: ProductUpdateVariantInput[],
    adminUserId: number,
  ) {
    const existing = await manager.find(ProductVariant, {
      where: { productId },
      select: ['id'],
    });
    const existingIds = new Set(existing.map((v) => v.id));
    const sentIds = variants
      .filter(
        (v): v is Extract<ProductUpdateVariantInput, { id: number }> =>
          'id' in v,
      )
      .map((v) => v.id);
    const foreignId = sentIds.find((id) => !existingIds.has(id));
    if (foreignId !== undefined) {
      throw new BadRequestException(
        `Biến thể cập nhật (id ${foreignId}) không thuộc sản phẩm này hoặc không còn tồn tại.`,
      );
    }

    const keepIds = new Set(sentIds);
    for (const variant of existing) {
      if (!keepIds.has(variant.id)) {
        await this.inventoryService.retireVariant(manager, {
          variantId: variant.id,
          actor: { type: 'ADMIN' as any, userId: adminUserId },
        });
      }
    }
    for (const variantId of sentIds) {
      await manager.update(ProductVariant, variantId, {
        name: `~${variantId}`,
        size: `~${variantId}`,
      });
    }

    for (const variant of variants) {
      if ('id' in variant) {
        await manager.update(ProductVariant, variant.id, {
          name: variant.name,
          size: variant.size ?? null,
        });
        continue;
      }
      await this.inventoryService.createVariantWithInitialStock(manager, {
        productId,
        productName,
        name: variant.name,
        size: variant.size ?? null,
        initialStock: variant.initialStock,
        actor: { type: 'ADMIN' as any, userId: adminUserId },
      });
    }
  }
  async updateProduct(
    id: number,
    input: ProductUpdateInput,
    adminUserId: number,
  ) {
    if (input.categoryId !== undefined) {
      await this.assertCategoryExists(input.categoryId);
    }
    // Không gửi variants = giữ nguyên; gửi mảng rỗng thường là lỗi form, chặn để không xoá hết biến thể
    if (input.variants !== undefined && input.variants.length === 0) {
      throw new BadRequestException('Sản phẩm phải có ít nhất một biến thể.');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.lockProductRow(manager, id);
      const existing = await manager.findOneOrFail(Product, { where: { id } });

      const patch: Partial<Product> = {};
      if (input.name !== undefined) {
        patch.name = input.name;
        patch.slug =
          input.name === existing.name
            ? existing.slug
            : await uniqueSlug(input.name, (slug) =>
                this.slugIsTaken(slug, id),
              );
      }
      if (input.description !== undefined)
        patch.description = input.description ?? '';
      if (input.price !== undefined) patch.price = input.price;
      if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
      if (input.isActive !== undefined) patch.isActive = input.isActive;
      if (input.skinTypes !== undefined) patch.skinTypes = pickSkinTypes(input.skinTypes);
      if (input.concerns !== undefined) patch.concerns = pickSkinConcerns(input.concerns);

      await manager.update(Product, id, patch);
      const updatedName = patch.name ?? existing.name;

      if (input.variants !== undefined) {
        await this.replaceVariants(
          manager,
          id,
          updatedName,
          input.variants,
          adminUserId,
        );
      }
    });

    return this.getProductById(id);
  }
  async removeProduct(id: number, adminUserId: number) {
    const { images, descriptionPdfUrl } = await this.dataSource.transaction(async (manager) => {
      await this.lockProductRow(manager, id);
      const product = await manager.findOneOrFail(Product, {
        where: { id },
        relations: ['variants', 'images'],
      });

      for (const variant of product.variants) {
        await this.inventoryService.retireVariant(manager, {
          variantId: variant.id,
          actor: { type: 'ADMIN' as any, userId: adminUserId },
        });
      }

      await manager.delete(Product, id);
      return product;
    });
    await Promise.all([
      ...images.map((image) => deleteStoredImage(image)),
      deleteStoredPdf(descriptionPdfUrl),
    ]);
  }
  async addProductImages(productId: number, files: UploadedImage[]) {
    if (files.length === 0) {
      throw new BadRequestException('Chưa chọn ảnh nào để tải lên.');
    }
    // Kiểm tra hết trước khi ghi file để không để lại file rác khi có 1 ảnh sai định dạng
    if (files.some((file) => !detectImageExtension(file.buffer))) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
    }

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này.');

    const startOrder = product.images.reduce(
      (max, img) => Math.max(max, img.sortOrder + 1),
      0,
    );
    const stored = await Promise.all(
      files.map((file) => storeProductImage(file.buffer)),
    );

    const rows = stored.map((image, index) =>
      this.imgRepo.create({
        productId,
        url: image.url,
        thumbUrl: image.thumbUrl,
        sortOrder: startOrder + index,
      }),
    );
    await this.imgRepo.save(rows);

    return this.getProductById(productId);
  }
  async setDescriptionPdf(productId: number, file?: UploadedPdf) {
    if (!file) throw new BadRequestException('Chưa chọn file PDF.');
    const isPdf =
      file.mimetype === 'application/pdf' &&
      file.buffer.subarray(0, 5).toString('latin1') === '%PDF-';
    if (!isPdf) throw new BadRequestException('Chỉ chấp nhận file PDF.');

    const product = await this.productRepo.findOne({
      where: { id: productId },
      select: ['id', 'descriptionPdfUrl'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này.');

    const url = await storeDescriptionPdf(file.buffer);
    await this.productRepo.update(productId, { descriptionPdfUrl: url });
    await deleteStoredPdf(product.descriptionPdfUrl);

    return this.getProductById(productId);
  }

  async removeDescriptionPdf(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      select: ['id', 'descriptionPdfUrl'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này.');

    await this.productRepo.update(productId, { descriptionPdfUrl: null });
    await deleteStoredPdf(product.descriptionPdfUrl);

    return this.getProductById(productId);
  }

  async removeProductImage(imageId: number) {
    const image = await this.imgRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh này.');

    await this.imgRepo.delete(imageId);
    await deleteStoredImage(image);
  }
}
