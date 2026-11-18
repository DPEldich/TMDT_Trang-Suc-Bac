import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '../../components/UI/Container';
import { CatalogView } from '../../components/CatalogView';
import { getAllProducts } from '../../data/products';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Bộ sưu tập trang sức bạc | NFA Jewelry',
  description:
    'Danh mục 8 sản phẩm trang sức bạc NFA bao gồm nhẫn, dây chuyền trơn, mặt dây chuyền, lắc tay và bông tai.',
};

export default function ProductsPage() {
  const products = getAllProducts();

  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
            <Link href="/" className={styles.crumbLink}>
              Trang chủ
            </Link>
            <span className={styles.crumbSeparator}>/</span>
            <span className={styles.crumbCurrent}>Bộ sưu tập</span>
          </nav>

          <h1 className={styles.pageTitle}>Bộ sưu tập trang sức bạc</h1>
          <p className={styles.pageDescription}>
            Danh mục sản phẩm với hình ảnh chụp thực tế. Số lượng tồn kho và giá bán là dữ liệu demo phục vụ học tập.
          </p>
        </Container>
      </div>

      <div className={styles.catalogContent}>
        <Container>
          <CatalogView products={products} />
        </Container>
      </div>
    </main>
  );
}
