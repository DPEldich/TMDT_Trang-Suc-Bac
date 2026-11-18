import Link from 'next/link';
import { Suspense } from 'react';
import { Hero } from '../components/Hero';
import { Container } from '../components/UI/Container';
import { ProductCard } from '../components/ProductCard';
import { FeedbackSection } from '../components/FeedbackSection';
import { LinkButton } from '../components/UI/Button';
import { getFeaturedProducts, getAllProducts } from '../data/products';
import { getSheetFeedback } from '../data/sheetFeedback';
import { CATEGORIES } from '../types/product';
import styles from './page.module.css';

async function LiveFeedback() {
  return <FeedbackSection feedbacks={await getSheetFeedback()} />;
}

export default function HomePage() {
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  const displayHighlights = featured.length > 0 ? featured : allProducts.slice(0, 4);

  return (
    <main className={styles.main}>
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Featured Jewelry Collection */}
      <section className={styles.section} aria-labelledby="featured-heading">
        <Container>
          <div className={styles.sectionHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.sectionSubtitle}>Sản phẩm</span>
              <h2 id="featured-heading" className={styles.sectionTitle}>
                Một số mẫu nổi bật
              </h2>
            </div>
            <LinkButton href="/san-pham" variant="outline" size="md">
              Xem toàn bộ sản phẩm →
            </LinkButton>
          </div>

          <div className={styles.productGrid}>
            {displayHighlights.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Category Explorations */}
      <section className={styles.categorySection} aria-labelledby="categories-heading">
        <Container>
          <div className={styles.centerHeader}>
            <span className={styles.sectionSubtitle}>Phân loại</span>
            <h2 id="categories-heading" className={styles.sectionTitle}>
              Danh mục sản phẩm
            </h2>
            <p className={styles.headerDesc}>
              Bao gồm nhẫn, dây chuyền trơn, mặt dây chuyền, lắc tay và bông tai.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href="/san-pham"
                className={styles.categoryCard}
              >
                <div className={styles.categoryCardHeader}>
                  <h3 className={styles.categoryCardTitle}>{cat.name}</h3>
                  <span className={styles.categoryArrow}>→</span>
                </div>
                <p className={styles.categoryCardDesc}>{cat.description}</p>
                <span className={styles.categoryExploreText}>Xem danh mục</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Storefront Principles */}
      <section className={styles.valuesSection} aria-labelledby="values-heading">
        <Container>
          <div className={styles.centerHeader}>
            <span className={styles.sectionSubtitle}>Thông tin</span>
            <h2 id="values-heading" className={styles.sectionTitle}>
              Nguyên tắc hiển thị thông tin
            </h2>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <span className={styles.valueNumber}>01</span>
              <h3 className={styles.valueTitle}>Ảnh chụp thực tế</h3>
              <p className={styles.valueDesc}>
                Hình ảnh sản phẩm hiển thị đúng theo ảnh chụp các mẫu trang sức có sẵn, không sử dụng ảnh minh họa dựng 3D.
              </p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueNumber}>02</span>
              <h3 className={styles.valueTitle}>Phân định chủng loại rõ ràng</h3>
              <p className={styles.valueDesc}>
                Ghi chú rõ ràng giữa sợi dây chuyền trơn (không kèm mặt) và mặt dây chuyền độc lập (không kèm dây).
              </p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueNumber}>03</span>
              <h3 className={styles.valueTitle}>Quy trình xác nhận đơn</h3>
              <p className={styles.valueDesc}>
                Khách hàng gửi thông tin qua biểu mẫu và cửa hàng sẽ liên hệ điện thoại xác nhận trước khi giao.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Feedback Section */}
      <Suspense fallback={<FeedbackSection feedbacks={[]} loading />}>
        <LiveFeedback />
      </Suspense>
    </main>
  );
}
