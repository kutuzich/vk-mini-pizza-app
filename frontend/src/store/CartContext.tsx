import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Pizza, PizzaSize, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (pizza: Pizza, size: PizzaSize) => void;
  removeItem: (pizzaId: number, size: PizzaSize) => void;
  updateQuantity: (pizzaId: number, size: PizzaSize, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (pizza: Pizza, size: PizzaSize) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.pizza.id === pizza.id && i.size === size,
      );
      if (existing) {
        return prev.map((i) =>
          i.pizza.id === pizza.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { pizza, size, quantity: 1 }];
    });
  };

  const removeItem = (pizzaId: number, size: PizzaSize) => {
    setItems((prev) =>
      prev.filter((i) => !(i.pizza.id === pizzaId && i.size === size)),
    );
  };

  const updateQuantity = (
    pizzaId: number,
    size: PizzaSize,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      removeItem(pizzaId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.pizza.id === pizzaId && i.size === size ? { ...i, quantity } : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const getPrice = (item: CartItem) => {
    const key = `price${item.size}` as keyof Pick<
      Pizza,
      'price25' | 'price30' | 'price35'
    >;
    return item.pizza[key] * item.quantity;
  };

  const totalPrice = items.reduce((sum, item) => sum + getPrice(item), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
