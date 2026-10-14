import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PERMISSIONS } from '../auth/permissions';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RoleGuard } from '../guard/role.guard';
import { CreateStaffDto, ResetStaffPasswordDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

/** Quản lý nhân viên: chỉ ADMIN */
@Controller('staff')
@UseGuards(JwtAuthGuard, RoleGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /** Danh sách quyền có thể gán */
  @Get('permissions')
  permissions() {
    return PERMISSIONS;
  }

  @Get()
  list() {
    return this.staffService.list();
  }

  @Post()
  create(@Body() body: CreateStaffDto) {
    return this.staffService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateStaffDto) {
    return this.staffService.update(id, body);
  }

  @Patch(':id/password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() body: ResetStaffPasswordDto) {
    return this.staffService.resetPassword(id, body.password);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}
