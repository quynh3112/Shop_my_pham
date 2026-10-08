import { PaymentMethod, PaymentStatus } from '../order/entity/order.entity'; // sửa đúng path entity của bạn
import { PaymentInitResult, PaymentOrderInfo, PaymentProvider } from './types';

export class CodPaymentProvider implements PaymentProvider {
  readonly method = PaymentMethod.COD;
  readonly implemented = true;

  async initiate(order: PaymentOrderInfo): Promise<PaymentInitResult> {
    return { paymentStatus: PaymentStatus.UNPAID };
  }
}