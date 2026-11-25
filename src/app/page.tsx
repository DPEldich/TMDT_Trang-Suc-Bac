import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Hero } from '../components/Hero';
import { Container } from '../components/UI/Container';
import { FeaturedCoverflow } from '../components/FeaturedProducts';
import { FeedbackSection } from '../components/FeedbackSection';
import { getFeaturedProducts, getAllProducts } from '../data/products';
import { getSheetFeedback } from '../data/sheetFeedback';
import { CATEGORIES, type Product, type ProductCategory } from '../types/product';
import styles from './page.module.css';

async function LiveFeedback() {
  return <FeedbackSection feedbacks={await getSheetFeedback()} />;
}

type CategoryLayoutSlot =
  | 'tall-primary'
  | 'tall-secondary'
  | 'wide-upper'
  | 'compact-left'
  | 'compact-right';

type CategoryTone = 'midnight' | 'champagne' | 'pearl' | 'mist';

interface CategoryShowcaseConfig {
  previewId: string;
  slot: CategoryLayoutSlot;
  tone: CategoryTone;
}

const CATEGORY_SHOWCASE_CONFIG: Record<ProductCategory, CategoryShowcaseConfig> = {
  nhan: {
    previewId: 'prod-01',
    slot: 'tall-primary',
    tone: 'midnight',
  },
  'day-chuyen': {
    previewId: 'prod-04',
    slot: 'tall-secondary',
    tone: 'champagne',
  },
  'lac-tay': {
    previewId: 'prod-06',
    slot: 'wide-upper',
    tone: 'pearl',
  },
  'bong-tai': {
    previewId: 'prod-08',
    slot: 'compact-left',
    tone: 'mist',
  },
  'lac-chan': {
    previewId: 'prod-51',
    slot: 'compact-right',
    tone: 'champagne',
  },
};

function getCategoryPreviewProduct(
  categoryId: ProductCategory,
  products: readonly Product[]
): Product | undefined {
  const preferredId = CATEGORY_SHOWCASE_CONFIG[categoryId].previewId;
  return (
    products.find((product) => product.id === preferredId) ??
    products.find((product) => product.category === categoryId)
  );
}

export default function HomePage() {
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  const displayHighlights =
    featured.length > 0 ? featured : allProducts.slice(0, 4);

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

      {/* 3. Asymmetric 5-Category Showcase */}
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

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const config = CATEGORY_SHOWCASE_CONFIG[category.id];
              const previewProduct = getCategoryPreviewProduct(
                category.id,
                allProducts
              );

              return (
                <Link
                  key={category.id}
                  href={`/san-pham?category=${category.id}`}
                  className={styles.categoryTile}
                  data-slot={config.slot}
                  data-tone={config.tone}
                >
                  <div className={styles.categoryCopy}>
                    <h3 className={styles.categoryTitle}>{category.name}</h3>
                  </div>

                  {previewProduct && (
                    <div className={styles.categoryMedia}>
                      <Image
                        src={previewProduct.image}
                        alt={previewProduct.imageAlt}
                        width={300}
                        height={300}
                        sizes="(max-width: 48rem) 200px, (max-width: 64rem) 220px, 260px"
                        loading="lazy"
                        className={styles.categoryImage}
                      />
                    </div>
                  )}

                  <span className={styles.categoryCueCircle} aria-hidden="true">
                    {config.tone === 'midnight' ? (
                      <ArrowUpRight className={styles.cueIcon} />
                    ) : (
                      <ChevronRight className={styles.cueIcon} />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <Suspense fallback={<FeedbackSection feedbacks={[]} loading />}>
        <LiveFeedback />
      </Suspense>
    </main>
  );
}
