import Image from 'next/image';
import { Container } from '../UI/Container';
import { LinkButton } from '../UI/Button';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.heroSection}>
      <Container className={styles.container}>
        <div className={styles.contentCol}>
          <h1 className={styles.heading}>
            Trang sức bạc NFA
          </h1>

          <p className={styles.description}>
            Cửa hàng giới thiệu các mẫu nhẫn, dây chuyền, mặt dây, lắc tay và bông tai bạc với thiết kế rõ ràng và hình ảnh thực tế.
          </p>

          <div className={styles.actionGroup}>
            <LinkButton href="/san-pham" size="lg" variant="primary">
              Xem sản phẩm
            </LinkButton>
          </div>
        </div>

        <div className={styles.visualCol}>
          <div className={styles.imageCard}>
            <div className={styles.imageWrapper}>
              <Image
                src="/products/SP-nhan-bac-dinh-da-pnjsilver-xm00k000088-1.png"
                alt="Nhẫn bạc đính đá NFA"
                width={360}
                height={360}
                priority
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
