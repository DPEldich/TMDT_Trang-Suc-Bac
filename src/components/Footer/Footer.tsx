import Link from 'next/link';
import { Container } from '../UI/Container';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.columnBrand}>
            <span className={styles.brandTitle}>NFA Trang Sức Bạc</span>
            <p className={styles.brandDesc}>
              Cửa hàng trực tuyến giới thiệu các sản phẩm trang sức bạc với hình ảnh chụp thực tế và thông tin rõ ràng.
            </p>
            <p className={styles.academicNote}>
              Đồ án môn học Thương mại điện tử.
            </p>
          </div>

          <div className={styles.columnLinks}>
            <span className={styles.sectionHeading}>Điều hướng</span>
            <ul className={styles.linkList}>
              <li>
                <Link href="/" className={styles.link}>
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/san-pham" className={styles.link}>
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link href="/ve-chung-toi" className={styles.link}>
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/gio-hang" className={styles.link}>
                  Giỏ hàng
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.columnLinks}>
            <span className={styles.sectionHeading}>Quy trình đặt hàng</span>
            <ul className={styles.linkList}>
              <li>
                <span className={styles.staticInfo}>1. Chọn sản phẩm vào giỏ</span>
              </li>
              <li>
                <span className={styles.staticInfo}>2. Gửi thông tin qua biểu mẫu</span>
              </li>
              <li>
                <span className={styles.staticInfo}>3. Cửa hàng liên hệ xác nhận</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} NFA Jewelry. Dữ liệu giá và số lượng là dữ liệu demo phục vụ học tập.
          </p>
          <p className={styles.membersCredit}>
            Nhóm 8 thành viên sinh viên TMĐT.
          </p>
        </div>
      </Container>
    </footer>
  );
}
