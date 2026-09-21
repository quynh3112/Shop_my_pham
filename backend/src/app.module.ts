import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { RefreshtokenController } from './modules/refreshtoken/refreshtoken.controller';
import { RefreshtokenModule } from './modules/refreshtoken/refreshtoken.module';
import { AddressModule } from './modules/address/address.module';
import { BannerModule } from './modules/banner/banner.module';
import { ProductModule } from './modules/product/product.module';
import { ProductvariantModule } from './modules/productvariant/productvariant.module';
import { ProductimageModule } from './modules/productimage/productimage.module';
import { CartModule } from './modules/cart/cart.module';
import { CartitemModule } from './modules/cartitem/cartitem.module';
import { OrderModule } from './modules/order/order.module';
import { OrderItemModule } from './modules/order_item/order_item.module';
import { OrderStatusHistoryModule } from './modules/order_status_history/order_status_history.module';
import { InventoryMovementModule } from './modules/inventory_movement/inventory_movement.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { ChatMessageModule } from './modules/chat_message/chat_message.module';
import { CategoryModule } from './modules/category/category.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports:[
    TypeOrmModule.forRoot({
      type:'postgres',
      host:'localhost',
      port:5432,
      username:'postgres',
      password:'quynh3112',
      database:'lunelle',
      autoLoadEntities: true,
  synchronize: true,
    }),
    UserModule,
    RefreshtokenModule,
    AddressModule,
    CategoryModule,
    BannerModule,
    ProductModule,
    ProductvariantModule,
    ProductimageModule,
    CartModule,
    CartitemModule,
    OrderModule,
    OrderItemModule,
    OrderStatusHistoryModule,
    InventoryMovementModule,
    AuthModule,
    ConversationModule,
    ChatMessageModule
  ],
  controllers: [AppController, RefreshtokenController],
  providers: [AppService],

})
export class AppModule {}
