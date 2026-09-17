import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { ProductImage } from '../productimage/entity/product_image.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { CategoryService } from '../category/category.service';
import { DataSource } from 'typeorm';
import { Category } from '../category/entity/category.entity';
import {
  ProductCreateInput,
  ProductQuery,
  ProductUpdateInput,
  ProductUpdateVariantInput,
} from './dto/product.dto';
import { uniqueSlug } from 'src/until/slug';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';

type UploadedImage = { buffer: Buffer };

const productImageDirectory = join(process.cwd(), 'uploads', 'products');

async function storeProductImage(buffer: Buffer) {
  await mkdir(productImageDirectory, { recursive: true });
  const filename = `${randomUUID()}.bin`;
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
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imgRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly categoryService: CategoryService,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryMovementService,
  ) {}
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
    query: ProductQuery,
    options?: { includeInactive?: boolean },
  ) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndMapMany(
        'product.images',
        ProductImage,
        'image',
        'image.productId=product.id',
      );
    if (options?.includeInactive !== true) {
      qb.andWhere('product.isActive = true');
    }
    if (query.search) {
      qb.andWhere('product.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.categoryId !== undefined) {
      const categoryIds = await this.categoryService.descendantCategoryIds(
        query.categoryId,
      );
      qb.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    // Lọc theo tên biến thể (tông màu/loại) và dung tích, kèm điều kiện CÒN
    // HÀNG: khách lọc "Shade 01" để tìm hàng mua được ngay.
    if (query.variantName !== undefined || query.size !== undefined) {
      const sub = this.variantRepo
        .createQueryBuilder('v')
        .select('v.productId')
        .where('v.stock > 0');
      if (query.variantName !== undefined) {
        sub.andWhere('v.name = :variantName', {
          variantName: query.variantName,
        });
      }
      if (query.size !== undefined) {
        sub.andWhere('v.size = :size', { size: query.size });
      }
      qb.andWhere(`product.id IN (${sub.getQuery()})`).setParameters(
        sub.getParameters(),
      );
    }
    switch (query.sort) {
      case 'price-asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'name':
        qb.orderBy('product.name', 'ASC');
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }
    // Với join quan hệ one-to-many, skip/take trên query gốc sẽ nhân bản sai
    // số dòng — lấy id trang hiện tại trước, rồi mới load đầy đủ theo id đó.
    const idQb = qb.clone().select('product.id').distinct(true);
    const orderByColumn =
      query.sort === 'price-asc' || query.sort === 'price-desc'
        ? 'product.price'
        : query.sort === 'name'
          ? 'product.name'
          : 'product.createdAt';
    idQb.addSelect(orderByColumn);
    const idRows = await idQb
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<{ product_id: number }>();
    const pageIds = idRows.map((r) => r.product_id);

    const total = await qb
      .clone()
      .select('product.id')
      .distinct(true)
      .getCount();
    if (pageIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
      };
    }
    const items = await this.productRepo.find({
      where: { id: In(pageIds) },
      relations: ['category', 'variants', 'images'],
    });
    const byId = new Map(items.map((p) => [p.id, p]));
    const ordered = pageIds.map((id) => byId.get(id)!);

    return {
      items: ordered.map(toSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
  private async lockProductRow(manager: EntityManager, productId: number) {
    const rows = await manager.query(
      'SELECT id FROM product WHERE id = ? FOR UPDATE',
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
    return toDetail(product);
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
    const images = await this.dataSource.transaction(async (manager) => {
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
      return product.images;
    });
     await Promise.all(images.map((image) => deleteStoredImage(image)));
  }
    async addProductImages(productId: number, files: UploadedImage[]) {
    if (files.length === 0) {
      throw new BadRequestException('Chưa chọn ảnh nào để tải lên.');
    }

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này.');

    const startOrder = product.images.reduce((max, img) => Math.max(max, img.sortOrder + 1), 0);
    const stored = await Promise.all(files.map((file) => storeProductImage(file.buffer)));

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
   async removeProductImage(imageId: number) {
    const image = await this.imgRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh này.');

    await this.imgRepo.delete(imageId);
    await deleteStoredImage(image);
  }
}
