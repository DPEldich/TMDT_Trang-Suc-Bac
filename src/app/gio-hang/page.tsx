import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '../../components/UI/Container';
import { CartView } from '../../components/CartView';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Giỏ hàng của bạn | NFA Jewelry',
  description:
    'Quản lý số lượng món trang sức bạc NFA, xem trước đơn giá và tiến hành đặt hàng thông qua biểu mẫu Google Forms.',
};

export default function CartPage() {
  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
            <Link href="/" className={styles.crumbLink}>
              Trang chủ
            </Link>
            <span className={styles.crumbSeparator}>/</span>
            <span className={styles.crumbCurrent}>Giỏ hàng</span>
          </nav>

          <h1 className={styles.pageTitle}>Giỏ hàng</h1>
          <p className={styles.pageDescription}>
            Kiểm tra lại số lượng các món trang sức bạc đã chọn trước khi tiến hành thanh toán qua biểu mẫu đơn hàng.
          </p>
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
