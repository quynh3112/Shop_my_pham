import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '../user/entity/user.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: Role };
    }>();

    if (request.user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    return true;
  }
}