import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { Container } from '../../../components/UI/Container';
import { ProductCard } from '../../../components/ProductCard';
import { AddToCartForm } from '../../../components/AddToCartForm';
import { getAllProducts, getProductBySlug } from '../../../data/products';
import {
  CATEGORIES,
  getItemTypeLabel,
  getSeparationNotice,
} from '../../../types/product';
import { formatVND } from '../../../utils/currency';
import styles from './page.module.css';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm | NFA',
    };
  }

  return {
    title: `${product.name} | NFA`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = getAllProducts();
  const relatedProducts = allProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const categoryInfo = CATEGORIES.find((item) => item.id === product.category);
  const typeLabel = getItemTypeLabel(product.itemType);
  const separationNotice = getSeparationNotice(product.itemType);

  return (
    <main id="main-content" className={styles.main}>
      <Container>
        <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
          <Link href="/" className={styles.crumbLink}>
            Trang chủ
          </Link>
          <span className={styles.crumbSeparator} aria-hidden="true">
            /
          </span>
          <Link href="/san-pham" className={styles.crumbLink}>
            Bộ sưu tập
          </Link>
          {categoryInfo && (
            <>
              <span className={styles.crumbSeparator} aria-hidden="true">
                /
              </span>
              <Link
                href={`/san-pham?category=${categoryInfo.id}`}
                className={styles.crumbLink}
              >
                {categoryInfo.name}
              </Link>
            </>
          )}
          <span className={styles.crumbSeparator} aria-hidden="true">
            /
          </span>
          <span className={styles.crumbCurrent} aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className={styles.productLayout}>
          {/* Dominant Minimal Studio Image Stage */}
          <div className={styles.galleryColumn}>
            <div className={styles.imageStage}>
              <Image
                src={product.image}
                alt={product.imageAlt}
                width={300}
                height={300}
                preload
                sizes="(max-width: 52rem) 280px, 300px"
                className={styles.productImage}
              />
              <span className={styles.floorShadow} aria-hidden="true" />
            </div>
          </div>

          {/* Clear Product Info & Purchase Column */}
          <div className={styles.detailsColumn}>
            <div className={styles.titleBlock}>
              <span className={styles.typeLabel}>{typeLabel}</span>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <p className={styles.priceValue}>{formatVND(product.price)}</p>
            </div>

            {separationNotice && (
              <div className={styles.separationCallout} role="note">
                <Info className={styles.calloutIcon} aria-hidden="true" />
                <p className={styles.calloutText}>{separationNotice}</p>
              </div>
            )}

            <p className={styles.leadDescription}>{product.description}</p>

            <div className={styles.purchaseArea}>
              <AddToCartForm product={product} />
            </div>

            <dl className={styles.specList}>
              <div className={styles.specRow}>
                <dt className={styles.specTerm}>Mã sản phẩm</dt>
                <dd className={styles.specMono}>{product.sku}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section
          className={styles.relatedSection}
          aria-labelledby="related-heading"
        >
          <div className={styles.relatedHeader}>
            <h2 id="related-heading" className={styles.relatedTitle}>
              Sản phẩm khác trong bộ sưu tập
            </h2>
          </div>

          <div className={styles.relatedGrid}>
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} headingAs="h3" />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
