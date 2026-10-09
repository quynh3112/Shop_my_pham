import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OtpPurpose {
  // Đăng nhập không còn dùng OTP. Giữ giá trị này vì xóa khỏi enum thì
  // synchronize lỗi trên DB còn bản ghi otp_codes cũ có purpose = LOGIN.
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
  REGISTER = 'REGISTER',
}

@Entity('otp_codes')
@Index(['userId', 'purpose'])
export class OtpCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose!: OtpPurpose;

  // Chỉ lưu hash của mã, không lưu mã gốc
  @Column({ length: 255 })
  codeHash!: string;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz' })
  expireAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
