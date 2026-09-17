import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entity/address.entity';

@Module({
  providers: [AddressService],
  controllers: [AddressController],
  imports:[TypeOrmModule.forFeature([Address])]
})
export class AddressModule {}
