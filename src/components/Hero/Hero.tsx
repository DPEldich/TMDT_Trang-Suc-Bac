import Image from 'next/image';
import { getAllProducts } from '../../data/products';
import { formatVND } from '../../utils/currency';
import { Container } from '../UI/Container';
import { LinkButton } from '../UI/Button';
import styles from './Hero.module.css';

export function Hero() {
  const products = getAllProducts();
  const heroProduct =
    products.find((product) => product.id === 'prod-02') ?? products[0];
  const minPrice = products.reduce(
    (lowest, product) => Math.min(lowest, product.price),
    products[0]?.price ?? 0
  );

  return (
    <section className={styles.heroSection} aria-labelledby="hero-heading">
      <Container className={styles.container}>
        <div className={styles.copyBlock}>
          <h1 id="hero-heading" className={styles.heading}>
            Trang sức NFA
          </h1>

          <p className={styles.subtitle}>
            Từ{' '}
            <span className={styles.priceInline}>{formatVND(minPrice)}</span>.
          </p>

          <div className={styles.actionGroup}>
            <LinkButton href="/san-pham" size="lg" variant="primary">
              Xem bộ sưu tập
            </LinkButton>
            {heroProduct && (
              <LinkButton
                href={`/san-pham/${heroProduct.slug}`}
                size="lg"
                variant="outline"
              >
                Xem chi tiết nhẫn viền đá
              </LinkButton>
            )}
          </div>
        </div>

        {heroProduct && (
          <div className={styles.visualStage}>
            <Image
              src={heroProduct.image}
              alt={heroProduct.imageAlt}
              width={300}
              height={300}
              preload
              sizes="(max-width: 36rem) 240px, 300px"
              className={styles.heroImage}
            />
            <span className={styles.floorShadow} aria-hidden="true" />
          </div>
        )}
      </Container>
    </section>
  );
}
