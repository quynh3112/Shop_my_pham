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
import type { FaceZone, Severity, SkinConcern, SkinType } from '../skin.constants';

export interface SkinFinding {
  zone: FaceZone;
  concern: SkinConcern;
  severity: Severity;
  note: string;
}

export interface FacePoint {
  x: number;
  y: number;
}

export interface SkinRecommendation {
  productId: number;
  score: number;
  matchedConcerns: SkinConcern[];
  matchesSkinType: boolean;
}

/**
 * Lịch sử phân tích da. Ảnh khuôn mặt (nếu khách đồng ý lưu) nằm ở thư mục riêng storage/,
 * KHÔNG nằm trong uploads/ công khai — chỉ trả về qua API có kiểm tra chủ sở hữu.
 */
@Entity('skin_analyses')
@Index(['userId', 'createdAt'])
export class SkinAnalysis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ type: 'varchar', length: 20 })
  skinType!: SkinType;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  findings!: SkinFinding[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  concerns!: SkinConcern[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tips!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  recommendations!: SkinRecommendation[];

  @Column({ type: 'varchar', length: 80 })
  model!: string;

  // Đường dẫn tương đối trong storage/, không bao giờ trả ra API
  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePath!: string | null;

  @Column({ type: 'int', nullable: true })
  imageWidth!: number | null;

  @Column({ type: 'int', nullable: true })
  imageHeight!: number | null;

  // Điểm mốc khuôn mặt (toạ độ 0..1) để tô lại vùng da trên ảnh khi xem lịch sử
  @Column({ type: 'jsonb', nullable: true })
  landmarks!: FacePoint[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
