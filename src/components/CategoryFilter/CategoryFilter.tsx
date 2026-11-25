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
    <div
      className={styles.filterWrapper}
      role="toolbar"
      aria-label="Lọc theo danh mục sản phẩm"
    >
      <div className={styles.controlsList}>
        <button
          type="button"
          className={clsx(styles.filterTab, selectedCategory === 'all' && styles.activeTab)}
          onClick={() => onSelectCategory('all')}
          aria-pressed={selectedCategory === 'all'}
          data-state={selectedCategory === 'all' ? 'active' : 'inactive'}
        >
          <span>Tất cả</span>
          <span className={styles.countBadge}>{allCount}</span>
        </button>

        {CATEGORIES.map((category) => {
          const count = categoryCounts[category.id] ?? 0;
          const isActive = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              className={clsx(styles.filterTab, isActive && styles.activeTab)}
              onClick={() => onSelectCategory(category.id)}
              aria-pressed={isActive}
              data-state={isActive ? 'active' : 'inactive'}
            >
              <span>{category.name}</span>
              <span className={styles.countBadge}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
