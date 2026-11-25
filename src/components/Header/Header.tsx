import { CurtainLink, NavigationCurtain } from './NavigationCurtain';
import { Container } from '../UI/Container';
import { HeaderSurface } from './HeaderSurface';
import { DesktopNav } from './DesktopNav';
import { CartBadge } from './CartBadge';
import { MobileNav } from './MobileNav';
import styles from './Header.module.css';

export function Header() {
  return (
    <NavigationCurtain>
      <HeaderSurface className={styles.header}>
        <a href="#main-content" className={styles.skipLink}>
          Chuyển đến nội dung chính
        </a>

        <Container className={styles.container}>
          <div className={styles.brandWrapper}>
            <CurtainLink
              href="/"
              className={styles.brandLink}
              aria-label="NFA — Trang sức, về trang chủ"
            >
              <span className={styles.brandName}>NFA</span>
            </CurtainLink>
          </div>

          <DesktopNav />

          <div className={styles.actions}>
            <CartBadge />
            <MobileNav />
          </div>
        </Container>
      </HeaderSurface>
    </NavigationCurtain>
  );
}
