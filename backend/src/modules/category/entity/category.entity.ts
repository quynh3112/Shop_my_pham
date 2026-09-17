import { Product } from 'src/modules/product/entity/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  // Category cha, category gốc sẽ có parentId = null
  @Column({ type: 'int', nullable: true })
  parentId!: number | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Category cha
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent!: Category | null;

  // Các category con
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  // Các sản phẩm thuộc category
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
