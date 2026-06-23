import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('pizzas')
export class Pizza {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: '' })
  image: string;

  @Column({ type: 'int', default: 0 })
  price25: number;

  @Column({ type: 'int', default: 0 })
  price30: number;

  @Column({ type: 'int', default: 0 })
  price35: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isHit: boolean;

  @ManyToOne(() => Category, (category) => category.pizzas, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
