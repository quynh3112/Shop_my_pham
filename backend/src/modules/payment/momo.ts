// momo.provider.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentMethod } from '../order/entity/order.entity';
import { PaymentInitResult, PaymentOrderInfo, PaymentProvider } from './types';

@Injectable()
export class MomoProvider implements PaymentProvider {
  readonly method = PaymentMethod.MOMO;
  readonly implemented = false;

  async initiate(_order: PaymentOrderInfo): Promise<PaymentInitResult> {
    const requiredKeys = [
      'MOMO_PARTNER_CODE',
      'MOMO_ACCESS_KEY',
      'MOMO_SECRET_KEY',
      'MOMO_ENDPOINT',
    ];

    const missing = requiredKeys.filter((key) => !process.env[key]);

    throw new HttpException(
      {
        code: 'PAYMENT_NOT_IMPLEMENTED',
        message:
          'Thanh toán MoMo chưa được đấu nối. Hiện tại vui lòng chọn thanh toán khi nhận hàng (COD).',
        ...(missing.length > 0 ? { missingConfig: missing } : {}),
      },
      HttpStatus.NOT_IMPLEMENTED,
    );}
}