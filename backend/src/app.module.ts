import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { PaymentModule } from './modules/payment/payment.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports:[
    ConfigModule.forRoot({ isGlobal: true }),
    // Thông tin kết nối lấy từ .env, máy nào chưa có .env thì dùng giá trị cũ
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'quynh3112'),
        database: config.get('DB_NAME', 'lunelle'),
        autoLoadEntities: true,
        synchronize: true,
      }),
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
    ChatMessageModule,
    PaymentModule,
    FavoritesModule,
    ReviewsModule
  ],
  controllers: [AppController, RefreshtokenController],
  providers: [AppService],

})
export class AppModule {}
