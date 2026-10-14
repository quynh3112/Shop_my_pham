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
  // null = token còn hiệu lực
  @Column({ type: 'timestamp', nullable: true })
  revokeAt!: Date | null;
  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
