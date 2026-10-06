// payment-provider.registry.ts
import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../order/entity/order.entity'; // sửa đúng path enum thật của bạn
import { CodPaymentProvider } from './code';
import { MomoProvider } from './momo';
import { PaymentProvider } from './types';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Record<PaymentMethod, PaymentProvider>;

  constructor(
    private readonly codProvider: CodPaymentProvider,
    private readonly momoProvider: MomoProvider,
  ) {
    this.providers = {
      [PaymentMethod.COD]: this.codProvider,
      [PaymentMethod.MOMO]: this.momoProvider,
    };
  }

  get(method: PaymentMethod): PaymentProvider {
    return this.providers[method];
  }
}