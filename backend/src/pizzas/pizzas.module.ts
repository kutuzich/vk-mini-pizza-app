import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pizza } from './entities/pizza.entity.js';
import { PizzasService } from './pizzas.service.js';
import { PizzasController } from './pizzas.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pizza])],
  controllers: [PizzasController],
  providers: [PizzasService],
  exports: [PizzasService],
})
export class PizzasModule {}
