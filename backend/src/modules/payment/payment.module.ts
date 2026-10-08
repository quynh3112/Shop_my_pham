import { Module } from '@nestjs/common';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { CodPaymentProvider } from './code';
import { MomoProvider } from './momo';

@Module({
  providers: [PaymentProviderRegistry,CodPaymentProvider,MomoProvider],
  exports:[PaymentProviderRegistry,CodPaymentProvider,MomoProvider]
  
})
export class PaymentModule {
    
}
