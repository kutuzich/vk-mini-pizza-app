import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PizzasService } from './pizzas.service.js';
import { CreatePizzaDto } from './dto/create-pizza.dto.js';
import { UpdatePizzaDto } from './dto/update-pizza.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('api/pizzas')
export class PizzasController {
  constructor(private readonly pizzasService: PizzasService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.pizzasService.findAll(
      categoryId ? +categoryId : undefined,
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pizzasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePizzaDto) {
    return this.pizzasService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePizzaDto) {
    return this.pizzasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pizzasService.remove(id);
  }
}
