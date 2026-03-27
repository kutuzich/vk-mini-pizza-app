import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pizza, Category, Order } from '../types';
import { OrderStatus } from '../types';
import { api } from '../api';
import { getImageUrl } from '../utils/image';
import styles from './AdminPage.module.css';

type Tab = 'orders' | 'menu' | 'categories';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('menu');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editPizza, setEditPizza] = useState<Pizza | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    const [p, c, o] = await Promise.all([
      api.getPizzas(),
      api.getCategories(),
      api.getOrders(),
    ]);
    setPizzas(p);
    setCategories(c);
    setOrders(o);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пиццу?')) return;
    await api.deletePizza(id);
    loadData();
  };

  const handleToggle = async (pizza: Pizza, field: 'isAvailable' | 'isHit') => {
    const fd = new FormData();
    fd.set('name', pizza.name);
    fd.set('description', pizza.description);
    fd.set('categoryId', String(pizza.categoryId));
    fd.set('price25', String(pizza.price25));
    fd.set('price30', String(pizza.price30));
    fd.set('price35', String(pizza.price35));
    fd.set('isAvailable', String(field === 'isAvailable' ? !pizza.isAvailable : pizza.isAvailable));
    fd.set('isHit', String(field === 'isHit' ? !pizza.isHit : pizza.isHit));
    await api.updatePizza(pizza.id, fd);
    loadData();
  };

  const handleOrderStatus = async (id: number, status: OrderStatus) => {
    await api.updateOrderStatus(id, status);
    loadData();
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Удалить заказ?')) return;
    await api.deleteOrder(id);
    loadData();
  };

  const handleSave = async (formData: FormData, id?: number) => {
    if (id) {
      await api.updatePizza(id, formData);
    } else {
      await api.createPizza(formData);
    }
    setEditPizza(null);
    setShowCreate(false);
    loadData();
  };

  const handleSaveCategory = async (data: { name: string; icon: string }, id?: number) => {
    if (id) {
      await api.updateCategory(id, data);
    } else {
      await api.createCategory(data);
    }
    setEditCategory(null);
    setShowCreateCategory(false);
    loadData();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Все пиццы в этой категории потеряют привязку.')) return;
    await api.deleteCategory(id);
    loadData();
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    preparing: 'Готовится',
    ready: 'Готово',
    cooking: 'Готовится',
    delivering: 'Доставляется',
    done: 'Доставлен',
  };

  const nextStatus: Record<string, OrderStatus> = {
    new: OrderStatus.PREPARING,
    preparing: OrderStatus.COOKING,
    ready: OrderStatus.COOKING,
    cooking: OrderStatus.DELIVERING,
    delivering: OrderStatus.DONE,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🍕</span>
          <div>
            <div className={styles.brand}>PizzaNyam</div>
            <div className={styles.sub}>Панель управления</div>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={loadData}>
          🔄 Обновить
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => setTab('orders')}
        >
          📋 Заказы
        </button>
        <button
          className={`${styles.tab} ${tab === 'menu' ? styles.tabActive : ''}`}
          onClick={() => setTab('menu')}
        >
          🍕 Меню
        </button>
        <button
          className={`${styles.tab} ${tab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setTab('categories')}
        >
          📁 Категории
        </button>
        {tab === 'menu' && (
          <button
            className={styles.addBtn}
            onClick={() => setShowCreate(true)}
          >
            + Добавить пиццу
          </button>
        )}
        {tab === 'categories' && (
          <button
            className={styles.addBtn}
            onClick={() => setShowCreateCategory(true)}
          >
            + Добавить категорию
          </button>
        )}
      </div>

      {tab === 'menu' && (
        <div className={styles.grid}>
          {pizzas.map((pizza) => {
            const imageUrl = getImageUrl(pizza.image);
            return (
              <div key={pizza.id} className={styles.card}>
                {pizza.isHit && <span className={styles.hit}>Хит</span>}
                <div className={styles.cardImage}>
                  <img src={imageUrl} alt={pizza.name} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardName}>{pizza.name}</span>
                    <span className={styles.cardPrice}>
                      {pizza.price35} ₽
                    </span>
                  </div>
                  <span className={styles.cardCat}>
                    {pizza.category?.name}
                  </span>
                  <p className={styles.cardDesc}>{pizza.description}</p>
                  <div className={styles.cardActions}>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={pizza.isAvailable}
                        onChange={() => handleToggle(pizza, 'isAvailable')}
                      />
                      <span className={styles.slider}></span>
                      Доступна
                    </label>
                    <button
                      className={styles.starBtn}
                      onClick={() => handleToggle(pizza, 'isHit')}
                    >
                      {pizza.isHit ? '⭐' : '☆'}
                    </button>
                    <button
                      className={styles.editBtn}
                      onClick={() => setEditPizza(pizza)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(pizza.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'orders' && (
        <div className={styles.ordersList}>
          <div className={styles.orderFilters}>
            {[
              { key: 'all', label: 'Все' },
              { key: 'new', label: 'Новые' },
              { key: 'active', label: 'В работе' },
              { key: 'done', label: 'Завершённые' },
            ].map((f) => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${orderFilter === f.key ? styles.filterBtnActive : ''}`}
                onClick={() => setOrderFilter(f.key)}
              >
                {f.label}
                {f.key === 'new' && (
                  <span className={styles.filterCount}>
                    {orders.filter((o) => o.status === 'new').length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {orders
            .filter((o) => {
              if (orderFilter === 'all') return true;
              if (orderFilter === 'new') return o.status === 'new';
              if (orderFilter === 'active')
                return ['preparing', 'cooking', 'delivering'].includes(o.status);
              if (orderFilter === 'done') return o.status === 'done';
              return true;
            })
            .length === 0 && (
            <p className={styles.empty}>Заказов нет</p>
          )}
          {orders
            .filter((o) => {
              if (orderFilter === 'all') return true;
              if (orderFilter === 'new') return o.status === 'new';
              if (orderFilter === 'active')
                return ['preparing', 'cooking', 'delivering'].includes(o.status);
              if (orderFilter === 'done') return o.status === 'done';
              return true;
            })
            .map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span className={styles.orderId}>Заказ #{order.id}</span>
                <span
                  className={`${styles.status} ${styles[`status_${order.status}`]}`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>
              <div className={styles.orderInfo}>
                <div>
                  {order.customerName} | {order.customerPhone}
                </div>
                <div>{order.address}</div>
                {order.paymentMethod && (
                  <div>Оплата: {order.paymentMethod}</div>
                )}
                {order.deliveryDate && order.timeSlot && (
                  <div>Доставка: {order.deliveryDate}, {order.timeSlot}</div>
                )}
                {order.comment && (
                  <div>Комментарий: {order.comment}</div>
                )}
                <div className={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
              <div className={styles.orderItems}>
                {order.items?.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    {item.pizza?.name} ({item.size} см) x{item.quantity} —{' '}
                    {item.price * item.quantity}₽
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <span className={styles.orderTotal}>
                  Итого: {order.totalPrice} ₽
                </span>
                <div className={styles.orderActions}>
                  {nextStatus[order.status] && (
                    <button
                      className={styles.nextBtn}
                      onClick={() =>
                        handleOrderStatus(order.id, nextStatus[order.status])
                      }
                    >
                      → {statusLabels[nextStatus[order.status]]}
                    </button>
                  )}
                  <button
                    className={styles.orderDeleteBtn}
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div className={styles.categoriesList}>
          {categories.length === 0 && (
            <p className={styles.empty}>Категорий нет</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryIcon}>{cat.icon || '📁'}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </div>
              <div className={styles.categoryActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => setEditCategory(cat)}
                >
                  ✏️
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editPizza || showCreate) && (
        <PizzaModal
          pizza={editPizza}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setEditPizza(null);
            setShowCreate(false);
          }}
        />
      )}

      {(editCategory || showCreateCategory) && (
        <CategoryModal
          category={editCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setEditCategory(null);
            setShowCreateCategory(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  onSave,
  onClose,
}: {
  category: Category | null;
  onSave: (data: { name: string; icon: string }, id?: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, icon }, category?.id);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{category ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Иконка (эмодзи)</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Например: 🍕"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PizzaModal({
  pizza,
  categories,
  onSave,
  onClose,
}: {
  pizza: Pizza | null;
  categories: Category[];
  onSave: (data: FormData, id?: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(pizza?.name || '');
  const [description, setDescription] = useState(pizza?.description || '');
  const [categoryId, setCategoryId] = useState(
    pizza?.categoryId || categories[0]?.id || 1,
  );
  const [price25, setPrice25] = useState(pizza?.price25 || 0);
  const [price30, setPrice30] = useState(pizza?.price30 || 0);
  const [price35, setPrice35] = useState(pizza?.price35 || 0);
  const [isAvailable, setIsAvailable] = useState(pizza?.isAvailable ?? true);
  const [isHit, setIsHit] = useState(pizza?.isHit ?? false);
  const [imageLink, setImageLink] = useState(pizza?.image || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('categoryId', String(categoryId));
    fd.set('price25', String(price25));
    fd.set('price30', String(price30));
    fd.set('price35', String(price35));
    fd.set('isAvailable', String(isAvailable));
    fd.set('isHit', String(isHit));
    fd.set('image', imageLink.trim());
    onSave(fd, pizza?.id);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{pizza ? 'Редактировать пиццу' : 'Добавить пиццу'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Ссылка на изображение</label>
            <input
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              placeholder="Например: https://site.com/pizza.jpg или /uploads/xxx.jpg"
              required={!pizza}
            />
          </div>
          <div className={styles.field}>
            <label>Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className={styles.field}>
            <label>Категория</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.pricesRow}>
            <div className={styles.field}>
              <label>25 см</label>
              <input
                type="number"
                value={price25}
                onChange={(e) => setPrice25(+e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>30 см</label>
              <input
                type="number"
                value={price30}
                onChange={(e) => setPrice30(+e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>35 см</label>
              <input
                type="number"
                value={price35}
                onChange={(e) => setPrice35(+e.target.value)}
              />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              Доступна для заказа
            </label>
            <label>
              <input
                type="checkbox"
                checked={isHit}
                onChange={(e) => setIsHit(e.target.checked)}
              />
              Хит продаж
            </label>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
