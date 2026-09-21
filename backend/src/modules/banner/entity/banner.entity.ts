// banner.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BannerPlacement {
  HOME_HERO = 'HOME_HERO',
  // thêm các giá trị khác nếu bạn có, ví dụ:
  // CATEGORY_TOP = 'CATEGORY_TOP',
  // SIDEBAR = 'SIDEBAR',
}

@Entity('banners')
@Index(['placement', 'isActive', 'sortOrder', 'id'])
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 255 })
  altText!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl!: string | null;

  @Column({
    type: 'enum',
    enum: BannerPlacement,
    default: BannerPlacement.HOME_HERO,
  })
  placement!: BannerPlacement;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}