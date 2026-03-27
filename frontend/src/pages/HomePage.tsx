import { useState, useEffect } from 'react';
import type { Pizza, Category } from '../types';
import { api } from '../api';
import { Header } from '../components/Header/Header';
import { CategoryFilter } from '../components/CategoryFilter/CategoryFilter';
import { PizzaCard } from '../components/PizzaCard/PizzaCard';
import { Cart } from '../components/Cart/Cart';
import styles from './HomePage.module.css';

export function HomePage() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    api
      .getPizzas(selectedCategory ?? undefined, search || undefined)
      .then(setPizzas);
  }, [selectedCategory, search]);

  return (
    <div className={styles.page}>
      <Header onCartOpen={() => setCartOpen(true)} />

      <section className={styles.hero}>
        <h1 className={styles.title}>
          Вкуснейшая пицца
          <br />
          <span className={styles.accent}>с доставкой на дом</span>
        </h1>
        <p className={styles.subtitle}>
          Свежие ингредиенты, итальянские рецепты и быстрая доставка
        </p>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            type="text"
            placeholder="Найти пиццу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className={styles.catalog}>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className={styles.grid}>
          {pizzas.map((pizza) => (
            <PizzaCard key={pizza.id} pizza={pizza} />
          ))}
        </div>
        {pizzas.length === 0 && (
          <p className={styles.empty}>Пиццы не найдены</p>
        )}
      </section>

      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
