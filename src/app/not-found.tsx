import { Container } from '../components/UI/Container';
import { LinkButton } from '../components/UI/Button';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <Container className={styles.container}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Không tìm thấy trang yêu cầu</h1>
        <p className={styles.desc}>
          Đường dẫn bạn truy cập có thể đã thay đổi hoặc không tồn tại trên hệ thống NFA Jewelry.
        </p>
        <div className={styles.actions}>
          <LinkButton href="/" variant="primary" size="lg">
            Về trang chủ
          </LinkButton>
          <LinkButton href="/san-pham" variant="outline" size="lg">
            Xem bộ sưu tập
          </LinkButton>
        </div>
      </Container>
    </main>
  );
}
