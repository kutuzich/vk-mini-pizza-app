import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { VK, MessageContext, Keyboard } from 'vk-io';
import { PizzasService } from '../pizzas/pizzas.service.js';
import { OrdersService } from '../orders/orders.service.js';

interface CartItem {
  pizzaId: number;
  name: string;
  size: number;
  price: number;
  quantity: number;
}

@Injectable()
export class VkBotService implements OnModuleInit {
  private readonly logger = new Logger(VkBotService.name);
  private vk: VK | null = null;
  private carts = new Map<number, CartItem[]>();

  constructor(
    private readonly pizzasService: PizzasService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    const token = process.env.VK_BOT_TOKEN;
    if (!token) {
      this.logger.warn(
        'VK_BOT_TOKEN not set, VK bot disabled. Set VK_BOT_TOKEN env variable to enable.',
      );
      return;
    }

    this.vk = new VK({ token });
    this.setupHandlers();
    this.vk.updates.start().catch((err) => {
      this.logger.error('VK bot failed to start', err);
    });
    this.logger.log('VK bot started');
  }

  private setupHandlers() {
    if (!this.vk) return;

    this.vk.updates.on('message_new', async (ctx: MessageContext) => {
      const text = (ctx.text || '').toLowerCase().trim();
      const peerId = ctx.peerId;

      if (text === 'начать' || text === 'старт' || text === 'привет') {
        return this.sendWelcome(ctx);
      }
      if (text === 'меню' || text === 'пицца') {
        return this.sendMenu(ctx);
      }
      if (text === 'корзина') {
        return this.sendCart(ctx, peerId);
      }
      if (text.startsWith('добавить ')) {
        return this.addToCart(ctx, peerId, text);
      }
      if (text.startsWith('оформить ')) {
        return this.checkout(ctx, peerId, text);
      }
      if (text.startsWith('статус ')) {
        return this.checkStatus(ctx, text);
      }
      if (text === 'очистить') {
        this.carts.delete(peerId);
        return ctx.send('Корзина очищена.');
      }

      return this.sendWelcome(ctx);
    });
  }

  private async sendWelcome(ctx: MessageContext) {
    const keyboard = Keyboard.builder()
      .textButton({ label: 'Меню', payload: { command: 'menu' }, color: 'positive' })
      .textButton({ label: 'Корзина', payload: { command: 'cart' }, color: 'primary' })
      .row()
      .textButton({ label: 'Очистить', payload: { command: 'clear' }, color: 'negative' });

    await ctx.send({
      message:
        '🍕 Добро пожаловать в Pizza House!\n\n' +
        'Команды:\n' +
        '• Меню — посмотреть доступные пиццы\n' +
        '• Добавить [название] [размер] — добавить в корзину\n' +
        '• Корзина — посмотреть заказ\n' +
        '• Оформить [Имя, Телефон, Адрес] — оформить заказ\n' +
        '• Статус [номер] — узнать статус заказа\n' +
        '• Очистить — очистить корзину',
      keyboard,
    });
  }

  private async sendMenu(ctx: MessageContext) {
    const pizzas = await this.pizzasService.findAll();
    const available = pizzas.filter((p) => p.isAvailable);

    if (available.length === 0) {
      return ctx.send('К сожалению, сейчас нет доступных пицц.');
    }

    let msg = '🍕 Наше меню:\n\n';
    for (const p of available) {
      msg += `${p.isHit ? '🔥 ' : ''}${p.name}\n`;
      msg += `${p.description}\n`;
      msg += `25 см — ${p.price25}₽ | 30 см — ${p.price30}₽ | 35 см — ${p.price35}₽\n\n`;
    }
    msg += 'Чтобы добавить в корзину, напишите:\nДобавить [название] [размер]\nНапример: Добавить Маргарита 30';

    await ctx.send(msg);
  }

  private async addToCart(ctx: MessageContext, peerId: number, text: string) {
    const parts = text.replace('добавить ', '').trim().split(' ');
    const sizeStr = parts.pop();
    const name = parts.join(' ');
    const size = parseInt(sizeStr || '30', 10);

    if (![25, 30, 35].includes(size)) {
      return ctx.send('Доступные размеры: 25, 30, 35 см');
    }

    const pizzas = await this.pizzasService.findAll();
    const pizza = pizzas.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() && p.isAvailable,
    );

    if (!pizza) {
      return ctx.send(`Пицца "${name}" не найдена. Напишите "Меню" чтобы посмотреть доступные.`);
    }

    const priceKey = `price${size}` as 'price25' | 'price30' | 'price35';
    const price = pizza[priceKey];

    const cart = this.carts.get(peerId) || [];
    const existing = cart.find(
      (i) => i.pizzaId === pizza.id && i.size === size,
    );
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({
        pizzaId: pizza.id,
        name: pizza.name,
        size,
        price,
        quantity: 1,
      });
    }
    this.carts.set(peerId, cart);

    await ctx.send(
      `✅ ${pizza.name} (${size} см) добавлена в корзину — ${price}₽\nНапишите "Корзина" чтобы посмотреть заказ.`,
    );
  }

  private async sendCart(ctx: MessageContext, peerId: number) {
    const cart = this.carts.get(peerId);
    if (!cart || cart.length === 0) {
      return ctx.send('Корзина пуста. Напишите "Меню" чтобы выбрать пиццу.');
    }

    let msg = '🛒 Ваша корзина:\n\n';
    let total = 0;
    for (const item of cart) {
      const subtotal = item.price * item.quantity;
      msg += `${item.name} (${item.size} см) x${item.quantity} — ${subtotal}₽\n`;
      total += subtotal;
    }
    msg += `\nИтого: ${total}₽\n\n`;
    msg += 'Для оформления напишите:\nОформить Имя, Телефон, Адрес';

    await ctx.send(msg);
  }

  private async checkout(ctx: MessageContext, peerId: number, text: string) {
    const cart = this.carts.get(peerId);
    if (!cart || cart.length === 0) {
      return ctx.send('Корзина пуста. Сначала добавьте пиццу.');
    }

    const info = text.replace('оформить ', '').trim();
    const parts = info.split(',').map((s) => s.trim());
    if (parts.length < 3) {
      return ctx.send(
        'Укажите данные через запятую:\nОформить Имя, Телефон, Адрес',
      );
    }

    const [customerName, customerPhone, ...addressParts] = parts;
    const address = addressParts.join(', ');

    const order = await this.ordersService.create({
      customerName,
      customerPhone,
      address,
      items: cart.map((item) => ({
        pizzaId: item.pizzaId,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    this.carts.delete(peerId);
    await ctx.send(
      `✅ Заказ #${order.id} оформлен!\nСумма: ${order.totalPrice}₽\n\nДля отслеживания напишите: Статус ${order.id}`,
    );
  }

  async sendOrderNotification(
    vkUserId: number,
    order: {
      id: number;
      totalPrice: number;
      status: string;
      paymentMethod?: string | null;
      deliveryDate?: string | null;
      timeSlot?: string | null;
      comment?: string;
      items: { pizza?: { name: string }; size: number; quantity: number; price: number }[];
    },
  ) {
    if (!this.vk) {
      this.logger.warn('Cannot send notification: VK bot not initialized');
      return;
    }

    const statusLabels: Record<string, string> = {
      new: 'Новый',
      preparing: 'Готовится',
      cooking: 'Готовится',
      delivering: 'Доставляется',
      done: 'Доставлен',
    };

    let msg = `🍕 Заказ #${order.id} оформлен!\n\n`;
    msg += `📋 Состав заказа:\n`;
    for (const item of order.items) {
      const name = item.pizza?.name || 'Пицца';
      msg += `  • ${name} x${item.quantity} — ${item.price * item.quantity}₽\n`;
    }
    msg += `\n💰 Итого: ${order.totalPrice}₽`;
    if (order.paymentMethod) {
      msg += ` (${order.paymentMethod})`;
    }
    msg += `\n`;
    if (order.timeSlot) {
      msg += `🕐 Время доставки: ${order.timeSlot}\n`;
    }
    msg += `📦 Статус: ${statusLabels[order.status] || order.status}\n`;
    if (order.comment) {
      msg += `💬 Комментарий: ${order.comment}\n`;
    }
    msg += `\nДля отслеживания напишите: Статус ${order.id}`;

    try {
      await this.vk.api.messages.send({
        user_id: vkUserId,
        message: msg,
        random_id: Math.floor(Math.random() * 1e9),
      });
      this.logger.log(`Order notification sent to VK user ${vkUserId}`);
    } catch (err) {
      this.logger.error(`Failed to send notification to VK user ${vkUserId}`, err);
    }
  }

  async sendStatusUpdateNotification(
    vkUserId: number,
    order: {
      id: number;
      status: string;
      totalPrice: number;
      timeSlot?: string | null;
      items: { pizza?: { name: string }; quantity: number; price: number }[];
    },
  ) {
    if (!this.vk) return;

    const statusLabels: Record<string, string> = {
      new: '🆕 Новый',
      preparing: '👨‍🍳 Готовится',
      cooking: '👨‍🍳 Готовится',
      delivering: '🚗 Доставляется',
      done: '✅ Доставлен',
    };

    let msg = `📦 Обновление заказа #${order.id}\n\n`;
    msg += `Статус: ${statusLabels[order.status] || order.status}\n\n`;
    msg += `📋 Состав:\n`;
    for (const item of order.items) {
      const name = item.pizza?.name || 'Пицца';
      msg += `  • ${name} x${item.quantity} — ${item.price * item.quantity}₽\n`;
    }
    msg += `\n💰 Итого: ${order.totalPrice}₽`;
    if (order.timeSlot) {
      msg += `\n🕐 Время доставки: ${order.timeSlot}`;
    }

    try {
      await this.vk.api.messages.send({
        user_id: vkUserId,
        message: msg,
        random_id: Math.floor(Math.random() * 1e9),
      });
      this.logger.log(`Status update notification sent to VK user ${vkUserId}`);
    } catch (err) {
      this.logger.error(`Failed to send status update to VK user ${vkUserId}`, err);
    }
  }

  private async checkStatus(ctx: MessageContext, text: string) {
    const idStr = text.replace('статус ', '').trim();
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return ctx.send('Укажите номер заказа: Статус 123');
    }

    try {
      const order = await this.ordersService.findOne(id);
      const statusLabels: Record<string, string> = {
        new: '🆕 Новый',
        preparing: '👨‍🍳 Готовится',
        ready: '✅ Готово',
        cooking: '👨‍🍳 Готовится',
        delivering: '🚗 Доставляется',
        done: '✅ Доставлен',
      };
      await ctx.send(
        `Заказ #${order.id}\nСтатус: ${statusLabels[order.status]}\nСумма: ${order.totalPrice}₽`,
      );
    } catch {
      await ctx.send('Заказ не найден.');
    }
  }
}
