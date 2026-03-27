import type { Category } from '../../types';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className={styles.filters}>
      <button
        className={`${styles.btn} ${selected === null ? styles.active : ''}`}
        onClick={() => onSelect(null)}
      >
        🍕 Все
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`${styles.btn} ${selected === cat.id ? styles.active : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
