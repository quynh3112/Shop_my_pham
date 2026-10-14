import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import { CustomerService } from './customer.service';
import { CustomerListQueryDto, CustomerStatusDto } from './dto/customer.dto';

@RequirePermission('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  list(@Query() query: CustomerListQueryDto) {
    return this.customerService.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.detail(id);
  }

  @Patch(':id/status')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() body: CustomerStatusDto) {
    return this.customerService.setStatus(id, body.isActive);
  }
}
