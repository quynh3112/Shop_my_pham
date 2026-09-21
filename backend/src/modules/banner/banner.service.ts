// banner.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Banner, BannerPlacement } from './entity/banner.entity';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

type BannerUploadFile = { buffer: Buffer };

const bannerImageDirectory = join(process.cwd(), 'uploads', 'banners');

async function storeBannerImage(buffer: Buffer) {
  await mkdir(bannerImageDirectory, { recursive: true });
  const filename = `${randomUUID()}.bin`;
  await writeFile(join(bannerImageDirectory, filename), buffer);
  return `/uploads/banners/${filename}`;
}

async function deleteUploadedFile(imageUrl?: string | null) {
  if (!imageUrl) return;

  const filename = basename(imageUrl);
  try {
    await unlink(join(bannerImageDirectory, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
  ) {}

  listActiveBanners(placement: BannerPlacement) {
    return this.bannerRepo.find({
      where: { placement, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  listAdminBanners() {
    return this.bannerRepo.find({
      order: { placement: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createBanner(input: CreateBannerDto, image: BannerUploadFile) {
    if (!image?.buffer) {
      throw new BadRequestException('Ảnh banner không được để trống.');
    }

    const imageUrl = await storeBannerImage(image.buffer);
    try {
      const banner = this.bannerRepo.create({
        ...input,
        linkUrl: input.linkUrl ?? null,
        imageUrl,
      });
      return await this.bannerRepo.save(banner);
    } catch (error) {
      await deleteUploadedFile(imageUrl).catch(() => undefined);
      throw error;
    }
  }

  async updateBanner(id: number, input: UpdateBannerDto) {
    await this.requireBanner(id);
    await this.bannerRepo.update(id, input);
    return this.requireBanner(id);
  }

  async setBannerActive(id: number, isActive: boolean) {
    await this.requireBanner(id);
    await this.bannerRepo.update(id, { isActive });
    return this.requireBanner(id);
  }

  async removeBanner(id: number) {
    const banner = await this.requireBanner(id);
    await deleteUploadedFile(banner.imageUrl).catch((error: unknown) => {
      console.error('[banner] không xoá được ảnh khi xóa banner:', error);
    });
    await this.bannerRepo.remove(banner);
    return { deleted: true, id };
  }

  async replaceBannerImage(id: number, image: BannerUploadFile) {
    if (!image?.buffer) {
      throw new BadRequestException('Ảnh banner không được để trống.');
    }

    const existing = await this.requireBanner(id);
    const imageUrl = await storeBannerImage(image.buffer);

    let banner: Banner;
    try {
      await this.bannerRepo.update(id, { imageUrl });
      banner = await this.requireBanner(id);
    } catch (error) {
      await deleteUploadedFile(imageUrl).catch(() => undefined);
      throw error;
    }

    // Chỉ xoá ảnh cũ sau khi đường dẫn mới đã commit thành công.
    await deleteUploadedFile(existing.imageUrl).catch((error: unknown) => {
      console.error('[banner] không xoá được ảnh cũ:', error);
    });
    return banner;
  }

  private async requireBanner(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Không tìm thấy banner.');
    return banner;
  }
}