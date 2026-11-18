'use client';

import clsx from 'clsx';
import { CATEGORIES } from '../../types/product';
import styles from './CategoryFilter.module.css';

export interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts: Record<string, number>;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryFilterProps) {
  const allCount = categoryCounts['all'] ?? 0;

  return (
    <div className={styles.filterWrapper} role="toolbar" aria-label="Bộ lọc danh mục sản phẩm">
      <div className={styles.scrollContainer}>
        <button
          type="button"
          className={clsx(styles.filterTab, selectedCategory === 'all' && styles.activeTab)}
          onClick={() => onSelectCategory('all')}
          aria-pressed={selectedCategory === 'all'}
        >
          <span>Tất cả</span>
          <span className={styles.countBadge}>{allCount}</span>
        </button>

        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] ?? 0;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              className={clsx(styles.filterTab, isActive && styles.activeTab)}
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isActive}
            >
              <span>{cat.name}</span>
              <span className={styles.countBadge}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
