import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: Product;
}

function getItemTypeLabel(itemType: Product['itemType']): string {
  switch (itemType) {
    case 'chain':
      return 'Dây chuyền trơn';
    case 'pendant':
      return 'Mặt dây chuyền';
    case 'ring':
      return 'Nhẫn bạc';
    case 'bracelet':
      return 'Lắc & Vòng tay';
    case 'earring':
      return 'Bông tai';
    default:
      return 'Trang sức';
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const typeLabel = getItemTypeLabel(product.itemType);

  return (
    <article className={styles.card}>
      <Link href={`/san-pham/${product.slug}`} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
        <div className={styles.imageContainer}>
          <Image
            src={product.image}
            alt={product.imageAlt}
            width={300}
            height={300}
            className={styles.productImage}
            loading="lazy"
          />
        </div>
      </Link>

      <div className={styles.details}>
        <div className={styles.metaRow}>
          <span className={styles.categoryBadge}>{typeLabel}</span>
          <span className={styles.skuText}>{product.sku}</span>
        </div>

        <h3 className={styles.title}>
          <Link href={`/san-pham/${product.slug}`} className={styles.titleLink}>
            {product.name}
          </Link>
        </h3>

        <p className={styles.shortDesc}>{product.shortDescription}</p>

        <div className={styles.bottomRow}>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Giá niêm yết</span>
            <span className={styles.priceValue}>{formatVND(product.price)}</span>
          </div>

          <div className={styles.stockContainer}>
            <span className={styles.stockDot} aria-hidden="true" />
            <span className={styles.stockText}>Còn {product.stock} món</span>
          </div>
        </div>

        <div className={styles.actionWrapper}>
          <Link href={`/san-pham/${product.slug}`} className={styles.viewDetailLink}>
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
