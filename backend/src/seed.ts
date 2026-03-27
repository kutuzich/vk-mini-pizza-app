import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './categories/entities/category.entity.js';
import { Pizza } from './pizzas/entities/pizza.entity.js';
import { OrderItem } from './orders/entities/order-item.entity.js';
import { Order } from './orders/entities/order.entity.js';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryRepo = app.get<Repository<Category>>(
    getRepositoryToken(Category),
  );
  const pizzaRepo = app.get<Repository<Pizza>>(getRepositoryToken(Pizza));
  const orderItemRepo = app.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
  const orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));

  await orderItemRepo.createQueryBuilder().delete().execute();
  await orderRepo.createQueryBuilder().delete().execute();
  await pizzaRepo.createQueryBuilder().delete().execute();
  await categoryRepo.createQueryBuilder().delete().execute();

  const categories = await categoryRepo.save([
    { name: 'Классические', icon: '🧀' },
    { name: 'Мясные', icon: '🥩' },
    { name: 'С курицей', icon: '🍗' },
    { name: 'Острые', icon: '🌶️' },
    { name: 'Особые', icon: '⭐' },
  ]);

  const [classic, meat, chicken, spicy, special] = categories;

  await pizzaRepo.save([
    {
      name: 'Маргарита',
      description: 'Картофельный соус, сыр Моцарелла, томаты',
      price25: 0,
      price30: 0,
      price35: 700,
      categoryId: classic.id,
      isAvailable: true,
      isHit: true,
    },
    {
      name: '4 сыра',
      description: 'Сливочный соус, сыр Моцарелла, сыр Чеддер, сыр Дор Блю, Пармезан',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: classic.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Овощная',
      description: 'Картофельный соус, сыр Моцарелла, томаты, перец, грибы, оливки',
      price25: 0,
      price30: 0,
      price35: 700,
      categoryId: classic.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Пепперони',
      description: 'Картофельный соус, сыр Моцарелла, пепперони',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: true,
    },
    {
      name: 'Мясная',
      description: 'Картофельный соус, сыр Моцарелла, ветчина, бекон, говядина, пепперони',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Аппетитная',
      description: 'Картофельный соус, сыр Моцарелла, ветчина, грибы, томаты',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Богатырская',
      description: 'Картофельный соус, сыр Моцарелла, ветчина, бекон, картофель',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Грибная ветчина',
      description: 'Картофельный соус, сыр Моцарелла, ветчина, грибы',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Свинина с корнишонами',
      description: 'Картофельный соус, сыр Моцарелла, свинина, корнишоны',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Чизбургер',
      description: 'Картофельный соус, сыр Моцарелла, говядина, маринованные огурцы, лук',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: meat.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Цезарь с курицей',
      description: 'Картофельный соус, сыр Моцарелла, Пармезан, курица, салат',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: chicken.id,
      isAvailable: true,
      isHit: true,
    },
    {
      name: 'Курица-Барбекю',
      description: 'Соус Барбекю, сыр Моцарелла, курица, бекон, лук',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: chicken.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Сливочный цыплёнок',
      description: 'Сливочный соус, сыр Моцарелла, курица, томаты',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: chicken.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Пиканте',
      description: 'Картофельный соус, сыр Моцарелла, пепперони, халапеньо, перец чили',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: spicy.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Чёрный жемчуг',
      description: 'Картофельный соус, сыр Моцарелла, маслины, оливки, грибы',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: special.id,
      isAvailable: true,
      isHit: false,
    },
    {
      name: 'Том Ям',
      description: 'Соус Том Ям, сыр Моцарелла, креветки, грибы, кинза',
      price25: 0,
      price30: 0,
      price35: 750,
      categoryId: special.id,
      isAvailable: true,
      isHit: false,
    },
  ]);

  console.log('Seed completed successfully! 16 pizzas added.');
  await app.close();
}

seed();
