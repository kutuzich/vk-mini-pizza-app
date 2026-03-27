import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoriesModule } from './categories/categories.module.js';
import { PizzasModule } from './pizzas/pizzas.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { VkBotModule } from './vk-bot/vk-bot.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    CategoriesModule,
    PizzasModule,
    OrdersModule,
    AuthModule,
    UploadsModule,
    VkBotModule,
  ],
})
export class AppModule {}
