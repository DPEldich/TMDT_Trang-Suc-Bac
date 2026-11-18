import Link from 'next/link';
import { Container } from '../UI/Container';
import { CartBadge } from './CartBadge';
import { MobileNav } from './MobileNav';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <Container className={styles.container}>
        <div className={styles.brandWrapper}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandName}>NFA</span>
            <span className={styles.brandTagline}>Trang sức bạc</span>
          </Link>
        </div>

        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          <Link href="/" className={styles.navLink}>
            Trang chủ
          </Link>
          <Link href="/san-pham" className={styles.navLink}>
            Bộ sưu tập
          </Link>
          <Link href="/ve-chung-toi" className={styles.navLink}>
            Về chúng tôi
          </Link>
        </nav>

        <div className={styles.actions}>
          <CartBadge />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
