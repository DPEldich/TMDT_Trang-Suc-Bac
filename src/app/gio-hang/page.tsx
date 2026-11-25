import type { Metadata } from 'next';
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
