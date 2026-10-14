// momo.provider.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '../order/entity/order.entity';
import { PaymentInitResult, PaymentOrderInfo, PaymentProvider } from './types';

/**
 * MOMO_MODE=live  -> cổng MoMo thật (CHƯA đấu nối, cần MOMO_PARTNER_CODE / ACCESS_KEY / SECRET_KEY / ENDPOINT)
 * Mặc định (sandbox) -> MoMo giả lập: đơn tạo ở trạng thái chưa thanh toán, khách được chuyển sang
 * trang thanh toán thử nghiệm của web và tự bấm "thành công" / "huỷ". KHÔNG trừ tiền thật.
 */
export const isMomoSandbox = () => (process.env.MOMO_MODE ?? 'sandbox').toLowerCase() !== 'live';

@Injectable()
export class MomoProvider implements PaymentProvider {
  readonly method = PaymentMethod.MOMO;

  get implemented() {
    return isMomoSandbox();
  }

  async initiate(order: PaymentOrderInfo): Promise<PaymentInitResult> {
    if (isMomoSandbox()) {
      // Đường dẫn trang thanh toán giả lập phía frontend
      return {
        paymentStatus: PaymentStatus.UNPAID,
        redirectUrl: `/payment/momo/${encodeURIComponent(order.code)}`,
      };
    }

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
