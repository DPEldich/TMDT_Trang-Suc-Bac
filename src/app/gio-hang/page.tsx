import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '../../components/UI/Container';
import { CartView } from '../../components/CartView';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Giỏ hàng | NFA',
  description:
    'Kiểm tra số lượng trang sức bạc NFA, xem tạm tính và gửi thông tin đặt hàng qua biểu mẫu Google Form.',
};

export default function CartPage() {
  return (
    <main id="main-content" className={styles.main}>
      <div className={styles.pageHeader}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
            <Link href="/" className={styles.crumbLink}>
              Trang chủ
            </Link>
            <span className={styles.crumbSeparator} aria-hidden="true">
              /
            </span>
            <span className={styles.crumbCurrent} aria-current="page">
              Giỏ hàng
            </span>
          </nav>

          <h1 className={styles.pageTitle}>Giỏ hàng</h1>
        </Container>
      </div>

      <div className={styles.cartContent}>
        <Container>
          <CartView />
        </Container>
      </div>
    </main>
  );
}
