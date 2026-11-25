'use client';

import { CurtainLink } from './NavigationCurtain';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import styles from './CartBadge.module.css';

export function CartBadge() {
  const { totalItems, isHydrated } = useCart();
  const pathname = usePathname();
  const count = isHydrated ? totalItems : 0;
  const isCartPage = pathname === '/gio-hang';

  return (
    <CurtainLink
      href="/gio-hang"
      className={styles.cartLink}
      data-active={isCartPage ? 'true' : 'false'}
      aria-current={isCartPage ? 'page' : undefined}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
    >
      <ShoppingBag className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>Giỏ hàng</span>
      <span className={styles.badge} data-has-items={count > 0 ? 'true' : 'false'}>
        {count}
      </span>
    </CurtainLink>
  );
}
