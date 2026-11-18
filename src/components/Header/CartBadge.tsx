'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import styles from './CartBadge.module.css';

export function CartBadge() {
  const { totalItems, isHydrated } = useCart();
  const count = isHydrated ? totalItems : 0;

  return (
    <Link
      href="/gio-hang"
      className={styles.cartLink}
      aria-label={`Giỏ hàng: ${count} sản phẩm`}
    >
      <ShoppingBag className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>Giỏ hàng</span>
      <span className={styles.badge} data-count={count}>
        {count}
      </span>
    </Link>
  );
}
