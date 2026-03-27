import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity.js';
import { Pizza } from '../pizzas/entities/pizza.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VkBotService } from '../vk-bot/vk-bot.service.js';

function getSlotsForDay(dayOfWeek: number): string[] {
  if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    return Array.from({ length: 9 }, (_, i) => `${12 + i}:00-${13 + i}:00`);
  }
  if (dayOfWeek === 6) {
    return Array.from({ length: 10 }, (_, i) => `${12 + i}:00-${13 + i}:00`);
  }
  return [];
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
    @InjectRepository(Pizza)
    private readonly pizzaRepo: Repository<Pizza>,
    @Inject(forwardRef(() => VkBotService))
    private readonly vkBotService: VkBotService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const order = await this.repo.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getAvailableSlots(date: string) {
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const allSlots = getSlotsForDay(dayOfWeek);
    if (allSlots.length === 0) return [];

    const booked = await this.repo.find({
      where: { deliveryDate: date },
      select: ['timeSlot'],
    });
    const bookedSet = new Set(booked.map((o) => o.timeSlot));
    return allSlots.map((slot) => ({
      slot,
      available: !bookedSet.has(slot),
    }));
  }

  async create(dto: CreateOrderDto) {
    if (dto.deliveryDate && dto.timeSlot) {
      const slots = await this.getAvailableSlots(dto.deliveryDate);
      const target = slots.find((s) => s.slot === dto.timeSlot);
      if (!target || !target.available) {
        throw new BadRequestException('This time slot is already booked');
      }
    }

    const pizzaIds = [...new Set(dto.items.map((i) => i.pizzaId))];
    const pizzas = await this.pizzaRepo.findBy({ id: In(pizzaIds) });
    const pizzaMap = new Map(pizzas.map((p) => [p.id, p]));

    const verifiedItems = dto.items.map((item) => {
      const pizza = pizzaMap.get(item.pizzaId);
      if (!pizza) throw new BadRequestException(`Pizza ${item.pizzaId} not found`);
      if (!pizza.isAvailable) throw new BadRequestException(`${pizza.name} is not available`);
      const price = pizza.price35;
      return { ...item, price, size: 35 };
    });

    const totalPrice = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const order = this.repo.create({ ...dto, items: verifiedItems, totalPrice });
    const saved = await this.repo.save(order);

    if (saved.vkUserId) {
      const full = await this.findOne(saved.id);
      this.vkBotService.sendOrderNotification(saved.vkUserId, full);
    }

    return saved;
  }

  async updateStatus(id: number, status: OrderStatus) {
    await this.findOne(id);
    await this.repo.update(id, { status });
    const updated = await this.findOne(id);

    if (updated.vkUserId) {
      this.vkBotService.sendStatusUpdateNotification(updated.vkUserId, updated);
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
