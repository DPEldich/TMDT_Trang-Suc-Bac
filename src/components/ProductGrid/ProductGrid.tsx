import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard';
import { Button } from '../UI/Button';
import styles from './ProductGrid.module.css';

export interface ProductGridProps {
  products: readonly Product[];
  headingAs?: 'h2' | 'h3';
  emptyMessage?: string;
  onResetFilter?: () => void;
  resetLabel?: string;
}

export function ProductGrid({
  products,
  headingAs = 'h3',
  emptyMessage = 'Hiện chưa có sản phẩm nào trong danh mục này.',
  onResetFilter,
  resetLabel = 'Xem tất cả sản phẩm',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer} role="status">
        <p className={styles.emptyText}>{emptyMessage}</p>
        {onResetFilter && (
          <Button type="button" variant="outline" size="md" onClick={onResetFilter}>
            {resetLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} headingAs={headingAs} />
      ))}
    </div>
  );
}
