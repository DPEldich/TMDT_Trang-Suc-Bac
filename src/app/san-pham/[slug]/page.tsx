import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Container } from '../../../components/UI/Container';
import { ProductCard } from '../../../components/ProductCard';
import { AddToCartForm } from '../../../components/AddToCartForm';
import { getAllProducts, getProductBySlug } from '../../../data/products';
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

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm | NFA Jewelry',
    };
  }

  return {
    title: `${product.name} | NFA Jewelry`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = getAllProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const getItemTypeBadge = () => {
    switch (product.itemType) {
      case 'chain':
        return 'Sợi dây chuyền trơn (Không kèm mặt)';
      case 'pendant':
        return 'Mặt dây chuyền (Không kèm dây)';
      case 'ring':
        return 'Nhẫn bạc';
      case 'bracelet':
        return 'Lắc & Vòng tay bạc';
      case 'earring':
        return 'Bông tai bạc';
    }
  };

  return (
    <main className={styles.main}>
      <Container>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
          <Link href="/" className={styles.crumbLink}>
            Trang chủ
          </Link>
          <span className={styles.crumbSeparator}>/</span>
          <Link href="/san-pham" className={styles.crumbLink}>
            Bộ sưu tập
          </Link>
          <span className={styles.crumbSeparator}>/</span>
          <span className={styles.crumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Hero Grid */}
        <div className={styles.productLayout}>
          {/* Gallery / Image Col */}
          <div className={styles.galleryColumn}>
            <div className={styles.mainImageCard}>
              <div className={styles.imageInner}>
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  width={500}
                  height={500}
                  priority
                  className={styles.productImage}
                />
              </div>
              <div className={styles.realPhotoTag}>
                <Sparkles className={styles.sparkleIcon} aria-hidden="true" />
                <span>Ảnh chụp thực tế</span>
              </div>
            </div>
          </div>

          {/* Details & Purchase Col */}
          <div className={styles.detailsColumn}>
            <div className={styles.itemHeader}>
              <span className={styles.typeBadge}>{getItemTypeBadge()}</span>
              <span className={styles.skuText}>SKU: {product.sku}</span>
            </div>

            <h1 className={styles.productTitle}>{product.name}</h1>

            <div className={styles.priceContainer}>
              <span className={styles.priceValue}>{formatVND(product.price)}</span>
            </div>

            <div className={styles.divider} />

            <p className={styles.leadDescription}>{product.description}</p>

            {/* Interactive AddToCart Boundary */}
            <div className={styles.purchaseSection}>
              <AddToCartForm product={product} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className={styles.relatedSection} aria-labelledby="related-heading">
          <div className={styles.relatedHeader}>
            <span className={styles.relatedSubtitle}>Gợi ý</span>
            <h2 id="related-heading" className={styles.relatedTitle}>
              Sản phẩm khác trong bộ sưu tập
            </h2>
          </div>

          <div className={styles.relatedGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
