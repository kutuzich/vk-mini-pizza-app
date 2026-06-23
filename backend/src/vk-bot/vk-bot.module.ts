import { Module, forwardRef } from '@nestjs/common';
import { VkBotService } from './vk-bot.service.js';
import { PizzasModule } from '../pizzas/pizzas.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [PizzasModule, forwardRef(() => OrdersModule)],
  providers: [VkBotService],
  exports: [VkBotService],
})
export class VkBotModule {}
