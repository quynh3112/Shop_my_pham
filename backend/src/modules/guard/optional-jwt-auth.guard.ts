import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Đăng nhập tuỳ chọn cho API công khai: có token hợp lệ thì gắn request.user,
 * không có / hết hạn thì coi như khách vãng lai (không báo lỗi 401).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_error: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
