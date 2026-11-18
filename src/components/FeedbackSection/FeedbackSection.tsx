import { MessageSquareQuote, Star } from 'lucide-react';
import { FEEDBACK_FORM_URL } from '../../data/feedback';
import type { CustomerFeedback } from '../../types/feedback';
import { LinkButton } from '../UI/Button';
import { Container } from '../UI/Container';
import styles from './FeedbackSection.module.css';

export interface FeedbackSectionProps {
  feedbacks: readonly CustomerFeedback[];
  loading?: boolean;
}

export function FeedbackSection({ feedbacks, loading = false }: FeedbackSectionProps) {
  const hasFeedback = feedbacks.length > 0;

  return (
    <section className={styles.section} aria-labelledby="feedback-heading">
      <Container>
        <div className={styles.header}>
          <h2 id="feedback-heading" className={styles.heading}>
            Đánh giá từ khách hàng
          </h2>
          <p className={styles.subheading}>
            Phản hồi thực tế từ khách mua hàng.
          </p>
          <LinkButton href={FEEDBACK_FORM_URL} variant="outline" className={styles.feedbackLink}>
            Gửi đánh giá
          </LinkButton>
        </div>

        {!hasFeedback ? (
          <div className={styles.emptyCard} role="status">
            <div className={styles.emptyIconCircle}>
              <MessageSquareQuote className={styles.emptyIcon} aria-hidden="true" />
            </div>
            <h3 className={styles.emptyTitle}>
              {loading ? 'Đang tải đánh giá' : 'Chưa có đánh giá nào'}
            </h3>
            <p className={styles.emptyDesc}>
              {loading ? 'Đang lấy phản hồi mới nhất.' : 'Phản hồi từ Google Form sẽ hiển thị tại đây.'}
            </p>
          </div>
        ) : (
          <div className={styles.feedbackGrid}>
            {feedbacks.map((fb) => (
              <article key={fb.id} className={styles.reviewCard}>
                {fb.rating !== undefined && (
                  <div className={styles.starRow} role="img" aria-label={`Đánh giá ${fb.rating} trên 5 sao`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={styles.starIcon}
                        data-filled={i < (fb.rating ?? 0)}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}

                <p className={styles.reviewContent}>&ldquo;{fb.content}&rdquo;</p>

                <div className={styles.reviewAuthor}>
                  <strong className={styles.authorName}>{fb.authorName}</strong>
                  {fb.location && (
                    <span className={styles.authorLocation}> • {fb.location}</span>
                  )}
                  {fb.productName && (
                    <span className={styles.authorProduct}>Sản phẩm: {fb.productName}</span>
                  )}
                  {fb.date && <span className={styles.authorDate}>{fb.date}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
