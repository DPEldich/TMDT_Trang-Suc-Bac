import { getAllProducts } from '../../data/products';
import { Container } from '../UI/Container';
import { LinkButton } from '../UI/Button';
import { HERO_MESSAGES } from './heroMessageScramble';
import { HeroMessages } from './HeroMessages';
import styles from './Hero.module.css';

export function Hero() {
  const products = getAllProducts();
  const heroProduct =
    products.find((product) => product.id === 'prod-02') ?? products[0];

  return (
    <section
      className={styles.heroSection}
      aria-labelledby="hero-heading"
      data-hero-surface-anchor="true"
    >
      <div className={styles.copyWash} aria-hidden="true" />

      <Container className={styles.container}>
        <div className={styles.copyBlock}>
          <h1 id="hero-heading" className={styles.heading}>
            Trang sức NFA
          </h1>

          <HeroMessages messages={HERO_MESSAGES} />

          <div className={styles.actionGroup}>
            <LinkButton href="/san-pham" size="lg" variant="primary">
              Xem bộ sưu tập
            </LinkButton>
            {heroProduct && (
              <LinkButton
                href={`/san-pham/${heroProduct.slug}`}
                size="lg"
                variant="outline"
                className={styles.secondaryCta}
              >
                Xem chi tiết nhẫn viền đá
              </LinkButton>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
