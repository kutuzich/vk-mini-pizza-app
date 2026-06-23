import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Pizza } from './entities/pizza.entity.js';
import { CreatePizzaDto } from './dto/create-pizza.dto.js';
import { UpdatePizzaDto } from './dto/update-pizza.dto.js';

@Injectable()
export class PizzasService {
  constructor(
    @InjectRepository(Pizza)
    private readonly repo: Repository<Pizza>,
  ) {}

  findAll(categoryId?: number, search?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = Like(`%${search}%`);
    return this.repo.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const pizza = await this.repo.findOneBy({ id });
    if (!pizza) throw new NotFoundException('Pizza not found');
    return pizza;
  }

  create(dto: CreatePizzaDto) {
    const pizza = this.repo.create(dto);
    return this.repo.save(pizza);
  }

  async update(id: number, dto: UpdatePizzaDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
