import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity.js';
import { Pizza } from '../../pizzas/entities/pizza.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => Pizza, { eager: true })
  @JoinColumn({ name: 'pizzaId' })
  pizza: Pizza;

  @Column()
  pizzaId: number;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  price: number;
}
