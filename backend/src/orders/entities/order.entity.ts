import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity.js';

export enum OrderStatus {
  NEW = 'new',
  PREPARING = 'preparing',
  READY = 'ready',
  COOKING = 'cooking',
  DELIVERING = 'delivering',
  DONE = 'done',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  customerName: string;

  @Column({ default: '' })
  customerPhone: string;

  @Column({ default: '' })
  address: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.NEW })
  status: OrderStatus;

  @Column({ type: 'int', default: 0 })
  totalPrice: number;

  @Column({ type: 'int', nullable: true })
  vkUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  timeSlot: string | null;

  @Column({ type: 'text', default: '' })
  comment: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
