import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Hero } from '../components/Hero';
import { Container } from '../components/UI/Container';
import { FeaturedCoverflow } from '../components/FeaturedProducts';
import {
  CategoryShowcase,
  buildCategoryShowcaseItems,
} from '../components/CategoryShowcase';
import { FeedbackSection } from '../components/FeedbackSection';
import { getFeaturedProducts, getAllProducts } from '../data/products';
import { getSheetFeedback } from '../data/sheetFeedback';
import styles from './page.module.css';

async function LiveFeedback() {
  return <FeedbackSection feedbacks={await getSheetFeedback()} />;
}

export default function HomePage() {
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  const displayHighlights =
    featured.length > 0 ? featured : allProducts.slice(0, 4);
  const categoryShowcaseItems = buildCategoryShowcaseItems(allProducts);

  return (
    <main id="main-content" className={styles.main}>
      {/* 1. Centered Product-Led Hero */}
      <Hero />

      {/* 2. Featured Products Coverflow Showcase */}
      <section
        className={styles.featuredSection}
        aria-labelledby="featured-heading"
      >
        <Container>
          <div className={styles.featuredHeader}>
            <div className={styles.featuredHeaderCopy}>
              <h2 id="featured-heading" className={styles.sectionTitle}>
                <span className={styles.sectionTitleAccent}>Mẫu nổi bật.</span>{' '}
                <span className={styles.sectionTitleCompanion}>
                  Thiết kế tiêu biểu từ bộ sưu tập.
                </span>
              </h2>
              <p className={styles.featuredIntroText}>
                Tuyển chọn trang sức bạc, vàng và bạch kim từ bộ sưu tập{' '}
                <span className={styles.featuredCount}>{allProducts.length}</span>{' '}
                thiết kế NFA.
              </p>
            </div>

            <Link href="/san-pham" className={styles.collectionLink}>
              <span>Xem bộ sưu tập</span>
              <ArrowUpRight className={styles.collectionLinkIcon} aria-hidden="true" />
            </Link>
          </div>

          {displayHighlights.length > 0 ? (
            <FeaturedCoverflow
              products={displayHighlights}
              headingId="featured-heading"
              headingAs="h3"
            />
          ) : (
            <div className={styles.emptyFeatured} role="status">
              <p className={styles.emptyFeaturedText}>
                Hiện chưa có mẫu nổi bật để hiển thị.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* 3. Editorial 5-Category Showcase */}
      <section
        className={styles.categorySection}
        aria-labelledby="categories-heading"
      >
        <Container>
          <div className={styles.sectionHeader}>
            <h2 id="categories-heading" className={styles.sectionTitle}>
              <span className={styles.sectionTitleAccent}>Danh mục.</span>{' '}
              <span className={styles.sectionTitleCompanion}>
                Năm dòng trang sức chủ đạo.
              </span>
            </h2>
          </div>

          <CategoryShowcase items={categoryShowcaseItems} />
        </Container>
      </section>

      <Suspense fallback={<FeedbackSection feedbacks={[]} loading />}>
        <LiveFeedback />
      </Suspense>
    </main>
  );
}
