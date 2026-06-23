import { Clock, Phone, ShoppingCart, Pizza } from 'lucide-react';
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
          <span className={styles.logoIcon}><Pizza size={28} /></span>
          <div>
            <div className={styles.brand}>Пицца-Ням</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.info}><Clock size={16} /> 12:00 - 22:00</span>
        <span className={styles.info}><Phone size={16} /> +7 (996) 930-51-59</span>
        <button className={styles.cartBtn} onClick={onCartOpen}>
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className={styles.badge}>{totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
}
