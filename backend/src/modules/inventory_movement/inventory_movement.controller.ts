import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import {
  AdjustStockDto,
  MovementListQueryDto,
  ReceiveStockDto,
  StockListQueryDto,
} from './dto/inventory.dto';
import { InventoryAdminService } from './inventory-admin.service';

interface AuthenticatedRequest {
  user: { userId: number };
}

@RequirePermission('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class InventoryMovementController {
  constructor(private readonly inventoryAdminService: InventoryAdminService) {}

  @Get('stock')
  listStock(@Query() query: StockListQueryDto) {
    return this.inventoryAdminService.listStock(query);
  }

  @Post('variants/:variantId/receive')
  receiveStock(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() body: ReceiveStockDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryAdminService.receiveStock(variantId, body, request.user.userId);
  }

  @Patch('variants/:variantId/adjust')
  adjustStock(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() body: AdjustStockDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryAdminService.adjustStock(variantId, body, request.user.userId);
  }

  @Get('movements')
  listMovements(@Query() query: MovementListQueryDto) {
    return this.inventoryAdminService.listMovements(query);
  }
}
