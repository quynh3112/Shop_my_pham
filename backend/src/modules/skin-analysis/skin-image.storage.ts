import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';

/**
 * Ảnh khuôn mặt lưu ở storage/skin-images/<userId>/ — thư mục KHÔNG được serve tĩnh
 * (khác uploads/), chỉ đọc qua API đã kiểm tra chủ sở hữu.
 * Tên file do server tự sinh nên không có chuyện đường dẫn do người dùng điều khiển.
 */
@Injectable()
export class SkinImageStorage {
  private readonly logger = new Logger(SkinImageStorage.name);
  private readonly root = join(process.cwd(), 'storage', 'skin-images');

  /** Lưu ảnh, trả về đường dẫn tương đối để ghi vào DB */
  async save(userId: number, image: Buffer, extension: string) {
    const relativePath = join(String(userId), `${randomUUID()}.${extension}`);
    await mkdir(join(this.root, String(userId)), { recursive: true });
    await writeFile(this.resolve(relativePath), image, { mode: 0o600 });
    return relativePath.split(sep).join('/');
  }

  /** Đường dẫn tuyệt đối, chặn mọi đường dẫn thoát ra ngoài thư mục gốc */
  resolve(relativePath: string) {
    const absolute = normalize(join(this.root, relativePath));
    if (!absolute.startsWith(this.root + sep)) throw new Error('Đường dẫn ảnh không hợp lệ');
    return absolute;
  }

  async remove(relativePath: string | null | undefined) {
    if (!relativePath) return;
    try {
      await unlink(this.resolve(relativePath));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Không xoá được ảnh phân tích da ${relativePath}: ${(error as Error).message}`);
      }
    }
  }
}
