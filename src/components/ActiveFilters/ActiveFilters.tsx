'use client';

import clsx from 'clsx';
import { X } from 'lucide-react';
import { CATEGORIES, MATERIALS } from '../../types/product';
import type { CatalogQueryState } from '../../utils/catalog';
import { formatVND } from '../../utils/currency';
import styles from './ActiveFilters.module.css';

export type ActiveFilterKey =
  | 'q'
  | 'category'
  | 'material'
  | 'minPrice'
  | 'maxPrice'
  | 'inStock';

export interface ActiveFiltersProps {
  queryState: Pick<
    CatalogQueryState,
    'q' | 'category' | 'material' | 'minPrice' | 'maxPrice' | 'inStock'
  >;
  onRemoveFilter: (key: ActiveFilterKey) => void;
  onResetAll: () => void;
  className?: string;
}

interface FilterChipItem {
  key: ActiveFilterKey;
  label: string;
  removeLabel: string;
}

export function ActiveFilters({
  queryState,
  onRemoveFilter,
  onResetAll,
  className,
}: ActiveFiltersProps) {
  const chips: FilterChipItem[] = [];

  if (queryState.q !== '') {
    chips.push({
      key: 'q',
      label: `Từ khóa: "${queryState.q}"`,
      removeLabel: `Xóa bộ lọc từ khóa ${queryState.q}`,
    });
  }

  if (queryState.category !== 'all') {
    const categoryName =
      CATEGORIES.find((item) => item.id === queryState.category)?.name ??
      queryState.category;
    chips.push({
      key: 'category',
      label: `Danh mục: ${categoryName}`,
      removeLabel: `Xóa bộ lọc danh mục ${categoryName}`,
    });
  }

  if (queryState.material !== 'all') {
    const materialName =
      MATERIALS.find((item) => item.id === queryState.material)?.name ??
      queryState.material;
    chips.push({
      key: 'material',
      label: `Chất liệu: ${materialName}`,
      removeLabel: `Xóa bộ lọc chất liệu ${materialName}`,
    });
  }

  if (queryState.minPrice !== null) {
    const formattedMin = formatVND(queryState.minPrice);
    chips.push({
      key: 'minPrice',
      label: `Giá từ: ${formattedMin}`,
      removeLabel: `Xóa bộ lọc giá từ ${formattedMin}`,
    });
  }

  if (queryState.maxPrice !== null) {
    const formattedMax = formatVND(queryState.maxPrice);
    chips.push({
      key: 'maxPrice',
      label: `Giá đến: ${formattedMax}`,
      removeLabel: `Xóa bộ lọc giá đến ${formattedMax}`,
    });
  }

  if (queryState.inStock) {
    chips.push({
      key: 'inStock',
      label: 'Còn hàng',
      removeLabel: 'Xóa bộ lọc chỉ hiện sản phẩm còn hàng',
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(styles.wrapper, className)}
      role="region"
      aria-label="Bộ lọc đang áp dụng"
    >
      <ul className={styles.chipList}>
        {chips.map((chip) => (
          <li key={chip.key} className={styles.chipItem}>
            <button
              type="button"
              className={styles.chipButton}
              onClick={() => onRemoveFilter(chip.key)}
              aria-label={chip.removeLabel}
            >
              <span className={styles.chipText}>{chip.label}</span>
              <X className={styles.removeIcon} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.resetButton}
        onClick={onResetAll}
      >
        Xóa tất cả
      </button>
    </div>
  );
}
