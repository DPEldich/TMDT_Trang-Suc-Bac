import Link from 'next/link';
import { CATEGORIES } from '../../types/product';
import { Container } from '../UI/Container';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>

        <div className={styles.grid}>
          <div className={styles.columnBrand}>
            <Link href="/" className={styles.brandTitle}>
              NFA
            </Link>
            <p className={styles.brandDesc}>
              Trang sức NFA.
            </p>
          </div>

          <div className={styles.column}>
            <p className={styles.columnHeading}>Cửa hàng</p>
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
                <Link href="/gio-hang" className={styles.link}>
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link href="/ve-chung-toi" className={styles.link}>
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <p className={styles.columnHeading}>Danh mục</p>
            <ul className={styles.linkList}>
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <Link href={`/san-pham?category=${category.id}`} className={styles.link}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>© {year} NFA — Trang sức.</p>
        </div>
      </Container>
    </footer>
  );
}
