import { useCart } from '../../store/CartContext';
import styles from './Header.module.css';

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const { totalItems } = useCart();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🍕</span>
          <div>
            <div className={styles.brand}>PizzaNyam</div>
            <div className={styles.tagline}>Доставка за 30 минут</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.info}>🕐 12:00 - 22:00</span>
        <span className={styles.info}>📞 +7 (996) 930-51-59</span>
        <button className={styles.cartBtn} onClick={onCartOpen}>
          🛒
          {totalItems > 0 && (
            <span className={styles.badge}>{totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
}
