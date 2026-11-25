import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '../../components/UI/Container';
import { CatalogView } from '../../components/CatalogView';
import { getAllProducts } from '../../data/products';
import { CATALOG_PAGE_SIZE } from '../../utils/catalog';
import styles from './page.module.css';

const TOTAL_PRODUCTS = getAllProducts().length;
const SKELETON_SLOTS = Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => index);
const SKELETON_CHIP_SLOTS = Array.from({ length: 6 }, (_, index) => index);

export const metadata: Metadata = {
  title: 'Bộ sưu tập trang sức | NFA',
  description: `Danh mục ${TOTAL_PRODUCTS} sản phẩm trang sức NFA bao gồm nhẫn, dây chuyền, mặt dây chuyền, lắc tay, bông tai và lắc chân.`,
};

function CatalogFallback() {
  return (
    <section
      className={styles.fallbackSection}
      aria-busy="true"
      aria-label="Đang tải danh sách sản phẩm"
    >
      <div className={styles.fallbackControls} aria-hidden="true">
        <div className={styles.fallbackSearchTrigger} />

        <div className={styles.fallbackChips}>
          {SKELETON_CHIP_SLOTS.map((slot) => (
            <div key={slot} className={styles.fallbackChip} />
          ))}
        </div>

        <div className={styles.fallbackToolbar}>
          <div className={styles.fallbackSelect} />
          <div className={styles.fallbackSummary} />
        </div>
      </div>

      <div className={styles.fallbackGrid} aria-hidden="true">
        {SKELETON_SLOTS.map((slot) => (
          <div key={slot} className={styles.fallbackCard}>
            <div className={styles.fallbackMedia} />
            <div className={styles.fallbackBody}>
              <div className={styles.fallbackMetaLine} />
              <div className={styles.fallbackTitleLine} />
              <div className={styles.fallbackPriceLine} />
              <div className={styles.fallbackCueLine} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProductsPage() {
  const products = getAllProducts();

  return (
    <main id="main-content" className={styles.main}>
      <div className={styles.pageHeader}>
        <Container>
          <h1 className={styles.pageTitle}>Bộ sưu tập</h1>
        </Container>
      </div>

      <div className={styles.catalogContent}>
        <Container>
          <Suspense fallback={<CatalogFallback />}>
            <CatalogView products={products} />
          </Suspense>
        </Container>
      </div>
    </main>
  );
}
