// Chạy: npm run seed
// Tạo tài khoản admin + danh mục + sản phẩm + banner. Chạy lại nhiều lần
// không bị trùng: bản ghi đã có thì bỏ qua.
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { Role, User } from '../modules/user/entity/user.entity';
import { Category } from '../modules/category/entity/category.entity';
import { Product } from '../modules/product/entity/product.entity';
import { ProductImage } from '../modules/productimage/entity/product_image.entity';
import { Banner } from '../modules/banner/entity/banner.entity';
import { ProductService } from '../modules/product/product.service';
import { banners, categories, products, SeedCategory } from './seed.data';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const productService = app.get(ProductService, { strict: false });

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const imageRepo = dataSource.getRepository(ProductImage);
  const bannerRepo = dataSource.getRepository(Banner);

  // ----- Tài khoản admin -----
  const adminEmail = config.get<string>('SEED_ADMIN_EMAIL', 'admin@lunelle.vn');
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (admin) {
    console.log(`- Admin ${adminEmail} đã có, bỏ qua`);
  } else {
    admin = await userRepo.save(
      userRepo.create({
        email: adminEmail,
        passwordHash: await bcrypt.hash(
          config.get<string>('SEED_ADMIN_PASSWORD', 'Admin@123'),
          10,
        ),
        fullName: 'Quản trị viên',
        phone: config.get<string>('SEED_ADMIN_PHONE', '0900000000'),
        role: Role.ADMIN,
      }),
    );
    console.log(`+ Tạo admin ${adminEmail}`);
  }

  // ----- Danh mục -----
  let createdCategories = 0;
  const saveCategories = async (
    nodes: SeedCategory[],
    parentId: number | null,
  ) => {
    for (const [index, node] of nodes.entries()) {
      let category = await categoryRepo.findOne({ where: { slug: node.slug } });
      if (!category) {
        category = await categoryRepo.save(
          categoryRepo.create({
            name: node.name,
            slug: node.slug,
            parentId,
            sortOrder: index,
          }),
        );
        createdCategories++;
      }
      if (node.children) await saveCategories(node.children, category.id);
    }
  };
  await saveCategories(categories, null);
  console.log(`+ Danh mục: tạo mới ${createdCategories}`);

  // ----- Sản phẩm (đi qua ProductService để tạo biến thể + phiếu nhập kho) -----
  let createdProducts = 0;
  for (const item of products) {
    if (await productRepo.findOne({ where: { name: item.name } })) continue;

    const category = await categoryRepo.findOne({
      where: { slug: item.categorySlug },
    });
    if (!category) {
      throw new Error(
        `Sản phẩm "${item.name}" trỏ tới danh mục không tồn tại: ${item.categorySlug}`,
      );
    }
    const product = await productService.createProduct(
      {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: category.id,
        isActive: true,
        variants: item.variants,
      },
      admin.id,
    );
    await imageRepo.save(
      item.images.map((url, sortOrder) =>
        imageRepo.create({
          productId: product.id,
          url,
          thumbUrl: url,
          sortOrder,
        }),
      ),
    );
    createdProducts++;
  }
  console.log(`+ Sản phẩm: tạo mới ${createdProducts}`);

  // ----- Banner trang chủ -----
  let createdBanners = 0;
  for (const [sortOrder, item] of banners.entries()) {
    if (await bannerRepo.findOne({ where: { name: item.name } })) continue;
    await bannerRepo.save(bannerRepo.create({ ...item, sortOrder }));
    createdBanners++;
  }
  console.log(`+ Banner: tạo mới ${createdBanners}`);

  await app.close();
}

seed()
  .then(() => console.log('Seed xong.'))
  .catch((err) => {
    console.error('Seed thất bại:', err);
    process.exit(1);
  });
