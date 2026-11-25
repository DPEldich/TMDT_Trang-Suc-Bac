import Image from 'next/image';
import Link from 'next/link';
import type { Ref } from 'react';
import { ChevronRight } from 'lucide-react';
import { getItemTypeLabel, type Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import styles from './FeaturedProducts.module.css';

export interface FeaturedProductCardProps {
  product: Product;
  headingAs?: 'h2' | 'h3';
  isActive: boolean;
  isPrioritizedImage?: boolean;
  actionLinkRef?: Ref<HTMLAnchorElement>;
}

export function FeaturedProductCard({
  product,
  headingAs = 'h3',
  isActive,
  isPrioritizedImage = false,
  actionLinkRef,
}: FeaturedProductCardProps) {
  const Heading = headingAs;
  const typeLabel = getItemTypeLabel(product.itemType);
  const isAvailable = product.stock > 0;

  return (
    <article
      className={styles.productCard}
      data-active={isActive ? 'true' : 'false'}
      aria-hidden={!isActive ? true : undefined}
    >
      <div className={styles.productVisual}>
        <Image
          src={product.image}
          alt={product.imageAlt}
          width={300}
          height={300}
          sizes="(max-width: 48rem) 190px, 240px"
          loading={isPrioritizedImage ? 'eager' : 'lazy'}
          draggable={false}
          className={styles.productImage}
        />
        <span className={styles.productFloorShadow} aria-hidden="true" />
      </div>

      <div className={styles.productBody}>
        <span className={styles.productType}>{typeLabel}</span>

        <Heading className={styles.productTitle}>{product.name}</Heading>

        <div className={styles.productMeta}>
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

        {isActive ? (
          <Link
            ref={actionLinkRef}
            href={`/san-pham/${product.slug}`}
            className={styles.productAction}
            data-active="true"
            draggable={false}
          >
            <span>Xem sản phẩm</span>
            <ChevronRight className={styles.actionIcon} aria-hidden="true" />
          </Link>
        ) : (
          <span
            className={styles.productAction}
            data-active="false"
            aria-hidden="true"
          >
            <span>Xem sản phẩm</span>
            <ChevronRight className={styles.actionIcon} aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}
