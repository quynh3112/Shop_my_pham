import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('RefreshToken')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({unique:true,length:64})
  tokenHash!: string;
  @Column()
  userId!: number;
  @Column()
  expireAt!: Date;
  @Column()
  revokeAt!: Date;
  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
