import { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import { vkInitPromise } from '../../main';
import { useCart } from '../../store/CartContext';
import type { TimeSlotInfo } from '../../types';
import { api } from '../../api';
import { getImageUrl } from '../../utils/image';
import styles from './Cart.module.css';

interface VkUser {
  vkUserId: number;
  name: string;
  photo: string;
}

function getVkUserFromUrl(): VkUser | null {
  const params = new URLSearchParams(window.location.search);
  const vkUserId = params.get('vk_user_id');
  const vkName = params.get('vk_name');
  if (vkUserId && vkName) {
    return {
      vkUserId: Number(vkUserId),
      name: vkName,
      photo: params.get('vk_photo') || '',
    };
  }
  return null;
}

function isInsideVkEnvironment(): boolean {
  if (vkBridge.isWebView()) return true;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    params.has('vk_user_id') || params.has('sign') || params.has('vk_app_id') ||
    hashParams.has('vk_user_id') || hashParams.has('sign') || hashParams.has('vk_app_id')
  );
}

async function getVkBridgeUser(): Promise<VkUser | null> {
  if (!isInsideVkEnvironment()) return null;
  try {
    await vkInitPromise;
    const info = await vkBridge.send('VKWebAppGetUserInfo');
    return {
      vkUserId: info.id,
      name: `${info.first_name} ${info.last_name}`,
      photo: info.photo_200 || '',
    };
  } catch (e) {
    console.warn('VK Bridge: failed to get user info', e);
    return null;
  }
}

function getTodayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isTodayWorkingDay(): boolean {
  const dow = new Date().getDay();
  return dow === 2 || dow === 3 || dow === 4 || dow === 6;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits;
  const parts = [
    num.slice(0, 3),
    num.slice(3, 6),
    num.slice(6, 8),
    num.slice(8, 10),
  ].filter(Boolean);

  if (parts.length === 0) return '';
  let result = '+7';
  if (parts[0]) result += ` (${parts[0]}`;
  if (parts[0]?.length === 3) result += ')';
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  return result;
}

function isPhoneComplete(phone: string): boolean {
  return phone.replace(/\D/g, '').length === 11;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } =
    useCart();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<TimeSlotInfo[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [vkUser, setVkUser] = useState<VkUser | null>(null);

  const todayISO = getTodayISO();
  const workingDay = isTodayWorkingDay();

  useEffect(() => {
    let cancelled = false;
    getVkBridgeUser().then((bridgeUser) => {
      if (cancelled) return;
      if (bridgeUser) {
        setVkUser(bridgeUser);
        setName(bridgeUser.name);
        return;
      }
      const stored = localStorage.getItem('vk_user');
      if (stored) {
        const user = JSON.parse(stored) as VkUser;
        setVkUser(user);
        setName(user.name);
      }
      const fromUrl = getVkUserFromUrl();
      if (fromUrl) {
        setVkUser(fromUrl);
        setName(fromUrl.name);
        localStorage.setItem('vk_user', JSON.stringify(fromUrl));
        window.history.replaceState({}, '', window.location.pathname);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showForm || !workingDay) return;
    api.getAvailableSlots(todayISO).then((data) => {
      setSlots(data);
      setSelectedSlot('');
    });
  }, [showForm, todayISO, workingDay]);

  const isInsideVk = vkBridge.isWebView() || isInsideVkEnvironment();

  const handleVkLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${apiUrl}/auth/vk`;
  };

  const handleVkLogout = () => {
    setVkUser(null);
    setName('');
    localStorage.removeItem('vk_user');
  };

  const canOrder =
    name && isPhoneComplete(phone) && address && paymentMethod && workingDay && selectedSlot;

  const handleOrder = async () => {
    if (!canOrder) return;
    const order = await api.createOrder({
      customerName: name,
      customerPhone: phone,
      address,
      paymentMethod,
      deliveryDate: todayISO,
      timeSlot: selectedSlot,
      comment: comment || undefined,
      vkUserId: vkUser?.vkUserId,
      items: items.map((item) => ({
        pizzaId: item.pizza.id,
        size: 35,
        quantity: item.quantity,
        price: item.pizza.price35,
      })),
    });
    setOrderSuccess(order.id);
    clearCart();
    setShowForm(false);
    setPhone('');
    setAddress('');
    setComment('');
    setPaymentMethod('');
    setSelectedSlot('');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.cart} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Корзина</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {orderSuccess && (
          <div className={styles.success}>
            Заказ #{orderSuccess} оформлен! Ожидайте доставку.
            {vkUser && (
              <div className={styles.vkNotice}>
                Подтверждение отправлено вам в VK
              </div>
            )}
            <button
              className={styles.successBtn}
              onClick={() => {
                setOrderSuccess(null);
                onClose();
              }}
            >
              Ок
            </button>
          </div>
        )}

        {items.length === 0 && !orderSuccess && (
          <p className={styles.empty}>Корзина пуста</p>
        )}

        <div className={styles.items}>
          {items.map((item) => {
            const imageUrl = getImageUrl(item.pizza.image);
            return (
              <div
                key={`${item.pizza.id}-${item.size}`}
                className={styles.item}
              >
                <img
                  src={imageUrl}
                  alt={item.pizza.name}
                  className={styles.itemImg}
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.pizza.name}</div>
                  <div className={styles.itemPrice}>
                    {item.pizza.price35} ₽
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(item.pizza.id, item.size, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span className={styles.qty}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(item.pizza.id, item.size, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.pizza.id, item.size)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Итого:</span>
              <span className={styles.totalPrice}>{totalPrice} ₽</span>
            </div>

            {showForm ? (
              <div className={styles.form}>
                {vkUser ? (
                  <div className={styles.vkUser}>
                    {vkUser.photo && (
                      <img
                        src={vkUser.photo}
                        alt=""
                        className={styles.vkAvatar}
                      />
                    )}
                    <span className={styles.vkName}>{vkUser.name}</span>
                    {!isInsideVk && (
                      <button
                        className={styles.vkLogout}
                        onClick={handleVkLogout}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : !isInsideVk ? (
                  <button className={styles.vkBtn} onClick={handleVkLogin}>
                    Войти через VK
                  </button>
                ) : null}

                <input
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                />
                <input
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className={styles.input}
                  type="tel"
                />
                <input
                  placeholder="Адрес доставки"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={styles.input}
                />

                <textarea
                  placeholder="Комментарий к заказу"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                  rows={2}
                />

                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Способ оплаты</div>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="payment"
                        value="Перевод"
                        checked={paymentMethod === 'Перевод'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Перевод</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="payment"
                        value="Наличные"
                        checked={paymentMethod === 'Наличные'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Наличные</span>
                    </label>
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Время доставки</div>
                  {!workingDay ? (
                    <div className={styles.noSlots}>
                      Сегодня нерабочий день. Заказы принимаются: Вт-Чт, Сб
                    </div>
                  ) : slots.length === 0 ? (
                    <div className={styles.noSlots}>Нет доступных слотов</div>
                  ) : (
                    <div className={styles.slotGrid}>
                      {slots.map((s) => (
                        <button
                          key={s.slot}
                          className={`${styles.slotBtn} ${selectedSlot === s.slot ? styles.slotBtnActive : ''} ${!s.available ? styles.slotBtnDisabled : ''}`}
                          disabled={!s.available}
                          onClick={() => setSelectedSlot(s.slot)}
                        >
                          {s.slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showConfirm ? (
                  <div className={styles.confirmBox}>
                    <div className={styles.confirmText}>
                      Оформить заказ на {totalPrice} ₽?
                    </div>
                    <div className={styles.confirmActions}>
                      <button
                        className={styles.confirmYes}
                        onClick={() => {
                          setShowConfirm(false);
                          handleOrder();
                        }}
                      >
                        Да, оформить
                      </button>
                      <button
                        className={styles.confirmNo}
                        onClick={() => setShowConfirm(false)}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={styles.orderBtn}
                    onClick={() => setShowConfirm(true)}
                    disabled={!canOrder}
                  >
                    Подтвердить заказ
                  </button>
                )}
              </div>
            ) : (
              <button
                className={styles.orderBtn}
                onClick={() => setShowForm(true)}
              >
                Оформить заказ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
