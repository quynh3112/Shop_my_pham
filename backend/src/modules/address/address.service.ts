import { Injectable, NotFoundException } from '@nestjs/common';
import { Address } from './entity/address.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressCreateDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
    constructor(@InjectRepository(Address) private addressRepository: Repository<Address>,
private readonly dataSource: DataSource) {}
   async findOwned(
  userId: number,
  id: number,
  manager?: EntityManager,
): Promise<Address> {
  const repo = manager ? manager.getRepository(Address) : this.addressRepository;
  const address = await repo.findOne({ where: { id, user: { id: userId } } });

  if (!address) {
    throw new NotFoundException('Địa chỉ không tồn tại hoặc không thuộc về bạn');
  }
  return address;
}
    async listAdrress(userId:number):Promise<Address[]>{
        return this.addressRepository.find({
            where: {user: {id: userId}},
            order: {isDefault: 'DESC', createAt: 'DESC'},
        });
    }
   async createAddress(userId: number, input: AddressCreateDto) {
    const { isDefault, ...fields } = input;

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.count(Address, { where: {user:{id:userId}} });
      const makeDefault = isDefault === true || existing === 0;

      if (makeDefault) {
        await manager.update(
          Address,
          { user: { id: userId }, isDefault: true },
          { isDefault: false },
        );
      }
       return manager.save(
        manager.create(Address, { ...fields, user: { id: userId }, isDefault: makeDefault }),
      );
    });
  }
  async updateAddress(userId: number, id: number, input: AddressCreateDto) {
    const address=await this.findOwned(userId, id);
    if(!address){
        throw new Error('Address not found or does not belong to the user');
    }
    Object.assign(address, input);
    return this.dataSource.getRepository(Address).save(address);
  }
  async setDefaultAddress(userId: number, id: number) {
    const address=await this.findOwned(userId, id);
    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        Address,
        { user: { id: userId }, isDefault: true },
        { isDefault: false },
      );
      if (!address) {
        throw new Error('Address not found or does not belong to the user');
      }
      address.isDefault = true;
      return manager.save(address);
    });
  }
   async removeAddress(userId: number, id: number) {
    return this.dataSource.transaction(async (manager) => {
      const address = await this.findOwned(userId, id, manager);
      if (!address) {
        throw new Error('Address not found or does not belong to the user');
      }

      await manager.delete(Address, { id });

      // Vừa xoá địa chỉ mặc định thì nâng địa chỉ mới nhất còn lại lên thay thế,
      // để tài khoản không rơi vào trạng thái có địa chỉ nhưng không có mặc định.
      if (address.isDefault) {
        const next = await manager.findOne(Address, {
          where: { user: { id: userId } },
          order: { createAt: 'DESC' },
        });

        if (next) {
          await manager.update(Address, { id: next.id }, { isDefault: true });
        }
      }

      return address;
    });}

    }




