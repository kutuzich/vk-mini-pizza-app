import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { VK, MessageContext, Keyboard } from 'vk-io';
import { PizzasService } from '../pizzas/pizzas.service.js';
import { OrdersService } from '../orders/orders.service.js';

@Injectable()
export class VkBotService implements OnModuleInit {
  private readonly logger = new Logger(VkBotService.name);
  private vk: VK | null = null;

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

      if (text === 'меню' || text === 'пицца') {
        return this.sendMenu(ctx);
      }
      if (text.startsWith('статус ')) {
        return this.checkStatus(ctx, text);
      }

      return this.sendWelcome(ctx);
    });
  }

  private async sendWelcome(ctx: MessageContext) {
    await ctx.send({
      message:
        '🍕 Добро пожаловать в ПиццаНям!\n\n' +
        'Доступные команды:\n' +
        '• Меню — посмотреть доступные пиццы\n' +
        '• Статус [номер] — узнать статус вашего заказа\n\n' +
        'Для оформления заказа воспользуйтесь нашим приложением.',
      keyboard: Keyboard.keyboard([]),
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
    msg += 'Для оформления заказа воспользуйтесь нашим приложением.';

    await ctx.send(msg);
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
      preparing: 'Принят',
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
    } catch (err: any) {
      const code = err?.code ?? err?.error_code ?? 'unknown';
      const desc = err?.message ?? err?.error_msg ?? String(err);
      this.logger.error(
        `Failed to send order notification to VK user ${vkUserId} — error ${code}: ${desc}`,
      );
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
      preparing: '✅ Принят',
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
    } catch (err: any) {
      const code = err?.code ?? err?.error_code ?? 'unknown';
      const desc = err?.message ?? err?.error_msg ?? String(err);
      this.logger.error(
        `Failed to send status update to VK user ${vkUserId} — error ${code}: ${desc}`,
      );
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
