import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getItemTypeLabel, type Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: Product;
  headingAs?: 'h2' | 'h3';
}

export function ProductCard({ product, headingAs = 'h3' }: ProductCardProps) {
  const Heading = headingAs;
  const typeLabel = getItemTypeLabel(product.itemType);
  const isAvailable = product.stock > 0;

  return (
    <article className={styles.card}>
      <div className={styles.mediaStage}>
        <Image
          src={product.image}
          alt={product.imageAlt}
          width={300}
          height={300}
          sizes="(max-width: 36rem) 82vw, (max-width: 60rem) 44vw, 240px"
          loading="lazy"
          className={styles.productImage}
        />
      </div>

      <div className={styles.body}>
        <span className={styles.typeLabel}>{typeLabel}</span>

        <Heading className={styles.title}>
          <Link href={`/san-pham/${product.slug}`} className={styles.titleLink}>
            {product.name}
          </Link>
        </Heading>

        <div className={styles.metaFooter}>
          <span className={styles.priceValue}>{formatVND(product.price)}</span>

          <span
            className={styles.stockStatus}
            data-available={isAvailable ? 'true' : 'false'}
          >
            <span className={styles.stockDot} aria-hidden="true" />
            <span>
              {isAvailable ? `Còn ${product.stock} sản phẩm` : 'Tạm hết hàng'}
            </span>
          </span>
        </div>

        <span className={styles.detailCue} aria-hidden="true">
          <span>Xem chi tiết</span>
          <ChevronRight className={styles.cueIcon} />
        </span>
      </div>
    </article>
  );
}
