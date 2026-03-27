export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Pizza {
  id: number;
  name: string;
  description: string;
  image: string;
  price25: number;
  price30: number;
  price35: number;
  isAvailable: boolean;
  isHit: boolean;
  categoryId: number;
  category: Category;
}

export type PizzaSize = 35;

export interface CartItem {
  pizza: Pizza;
  size: PizzaSize;
  quantity: number;
}

export const OrderStatus = {
  NEW: 'new',
  PREPARING: 'preparing',
  READY: 'ready',
  COOKING: 'cooking',
  DELIVERING: 'delivering',
  DONE: 'done',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface OrderItem {
  id: number;
  pizzaId: number;
  pizza: Pizza;
  size: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  address: string;
  status: OrderStatus;
  totalPrice: number;
  paymentMethod?: string;
  deliveryDate?: string;
  timeSlot?: string;
  comment?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface TimeSlotInfo {
  slot: string;
  available: boolean;
}
