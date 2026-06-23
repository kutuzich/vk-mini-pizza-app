import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Pizza } from '../pizzas/entities/pizza.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { VkBotModule } from '../vk-bot/vk-bot.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Pizza]),
    forwardRef(() => VkBotModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
