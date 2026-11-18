'use client';

import { useState, useMemo } from 'react';
import type { Product } from '../../types/product';
import { CategoryFilter } from '../CategoryFilter';
import { ProductGrid } from '../ProductGrid';
import styles from './CatalogView.module.css';

export interface CatalogViewProps {
  products: readonly Product[];
}

export function CatalogView({ products }: CatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
    };
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className={styles.wrapper}>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      <div className={styles.resultsInfo}>
        <span className={styles.resultsCount}>
          Hiển thị <strong className={styles.bold}>{filteredProducts.length}</strong> sản phẩm trang sức bạc
        </span>
      </div>

      <ProductGrid
        products={filteredProducts}
        emptyMessage="Không có sản phẩm nào thuộc phân loại này."
      />
    </div>
  );
}
