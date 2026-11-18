import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard';
import styles from './ProductGrid.module.css';

export interface ProductGridProps {
  products: readonly Product[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = 'Không tìm thấy sản phẩm nào trong danh mục này.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
