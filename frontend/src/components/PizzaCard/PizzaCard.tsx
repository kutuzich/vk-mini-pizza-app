import type { Pizza } from '../../types';
import { useCart } from '../../store/CartContext';
import { getImageUrl } from '../../utils/image';
import styles from './PizzaCard.module.css';

interface PizzaCardProps {
  pizza: Pizza;
}

export function PizzaCard({ pizza }: PizzaCardProps) {
  const { addItem } = useCart();

  const imageUrl = getImageUrl(pizza.image);

  return (
    <div className={styles.card}>
      {pizza.isHit && <span className={styles.hit}>Хит продаж</span>}
      <div className={styles.imageWrap}>
        <img src={imageUrl} alt={pizza.name} className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{pizza.name}</h3>
        <p className={styles.desc}>{pizza.description}</p>
        <div className={styles.bottom}>
          <span className={styles.price}>{pizza.price35} ₽</span>
          <button
            className={styles.addBtn}
            onClick={() => addItem(pizza, 35)}
          >
            + В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
