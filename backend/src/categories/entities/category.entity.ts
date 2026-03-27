import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Pizza } from '../../pizzas/entities/pizza.entity.js';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: '' })
  icon: string;

  @OneToMany(() => Pizza, (pizza) => pizza.category)
  pizzas: Pizza[];
}
