import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import { Hero } from '../components/Hero';
import { Container } from '../components/UI/Container';
import { ProductCard } from '../components/ProductCard';
import { FeedbackSection } from '../components/FeedbackSection';
import { getFeaturedProducts, getAllProducts } from '../data/products';
import { getSheetFeedback } from '../data/sheetFeedback';
import { CATEGORIES, type Product, type ProductCategory } from '../types/product';
import styles from './page.module.css';

async function LiveFeedback() {
  return <FeedbackSection feedbacks={await getSheetFeedback()} />;
}

const CATEGORY_PREVIEW_IDS: Record<ProductCategory, string> = {
  nhan: 'prod-01',
  'day-chuyen': 'prod-04',
  'lac-tay': 'prod-06',
  'bong-tai': 'prod-08',
  'lac-chan': 'prod-51',
};

function getCategoryPreviewProduct(
  categoryId: ProductCategory,
  products: readonly Product[]
): Product | undefined {
  const preferredId = CATEGORY_PREVIEW_IDS[categoryId];
  return (
    products.find((product) => product.id === preferredId) ??
    products.find((product) => product.category === categoryId)
  );
}

export default function HomePage() {
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  const displayHighlights = featured.length > 0 ? featured : allProducts.slice(0, 4);

  return (
    <main id="main-content" className={styles.main}>
      {/* 1. Centered Product-Led Hero */}
      <Hero />

      {/* 2. Featured Products */}
      <section className={styles.featuredSection} aria-labelledby="featured-heading">
        <Container>
          <div className={styles.sectionHeader}>
            <h2 id="featured-heading" className={styles.sectionTitle}>
              Mẫu nổi bật
            </h2>
            <Link href="/san-pham" className={styles.sectionActionLink}>
              <span>Xem tất cả</span>
              <ChevronRight className={styles.actionChevron} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.productGrid}>
            {displayHighlights.map((product) => (
              <ProductCard key={product.id} product={product} headingAs="h3" />
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Image-Led Categories */}
      <section className={styles.categorySection} aria-labelledby="categories-heading">
        <Container>
          <div className={styles.sectionHeader}>
            <h2 id="categories-heading" className={styles.sectionTitle}>
              Danh mục
            </h2>
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const previewProduct = getCategoryPreviewProduct(category.id, allProducts);

              return (
                <Link
                  key={category.id}
                  href={`/san-pham?category=${category.id}`}
                  className={styles.categoryTile}
                >
                  <div className={styles.categoryCopy}>
                    <h3 className={styles.categoryTitle}>{category.name}</h3>
                    <span className={styles.categoryAction}>
                      <span>Xem danh mục</span>
                      <ChevronRight className={styles.actionChevron} aria-hidden="true" />
                    </span>
                  </div>

                  {previewProduct && (
                    <div className={styles.categoryMedia}>
                      <Image
                        src={previewProduct.image}
                        alt={previewProduct.imageAlt}
                        width={300}
                        height={300}
                        sizes="(max-width: 48rem) 144px, 176px"
                        loading="lazy"
                        className={styles.categoryImage}
                      />
                    </div>
                  )}
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
