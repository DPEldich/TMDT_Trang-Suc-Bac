import { ExternalLink, MessageSquareQuote, Star } from 'lucide-react';
import { FEEDBACK_FORM_URL } from '../../data/feedback';
import type { CustomerFeedback } from '../../types/feedback';
import { LinkButton } from '../UI/Button';
import { Container } from '../UI/Container';
import styles from './FeedbackSection.module.css';

export interface FeedbackSectionProps {
  feedbacks: readonly CustomerFeedback[];
  loading?: boolean;
}

export function FeedbackSection({
  feedbacks,
  loading = false,
}: FeedbackSectionProps) {
  const hasFeedback = feedbacks.length > 0;

  return (
    <section className={styles.section} aria-labelledby="feedback-heading">
      <Container>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 id="feedback-heading" className={styles.heading}>
              Đánh giá từ khách hàng
            </h2>
          </div>

          <LinkButton
            href={FEEDBACK_FORM_URL}
            variant="outline"
            size="md"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.feedbackLink}
          >
            <span>Gửi đánh giá</span>
            <ExternalLink className={styles.externalIcon} aria-hidden="true" />
          </LinkButton>
        </div>

        {!hasFeedback ? (
          <div
            className={styles.emptyCard}
            role="status"
            aria-busy={loading ? 'true' : undefined}
          >
            <div className={styles.emptyIconCircle}>
              <MessageSquareQuote
                className={styles.emptyIcon}
                aria-hidden="true"
              />
            </div>
            <h3 className={styles.emptyTitle}>
              {loading ? 'Đang tải đánh giá' : 'Chưa có đánh giá nào'}
            </h3>
          </div>
        ) : (
          <div
            className={styles.feedbackGrid}
            data-count={feedbacks.length === 1 ? 'single' : 'multiple'}
          >
            {feedbacks.map((feedback) => (
              <article key={feedback.id} className={styles.reviewCard}>
                {feedback.rating !== undefined && (
                  <div
                    className={styles.starRow}
                    role="img"
                    aria-label={`Đánh giá ${feedback.rating} trên 5 sao`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={styles.starIcon}
                        data-filled={index < (feedback.rating ?? 0) ? 'true' : 'false'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}

                <p className={styles.reviewContent}>
                  &ldquo;{feedback.content}&rdquo;
                </p>

                <div className={styles.reviewAuthor}>
                  <strong className={styles.authorName}>
                    {feedback.authorName}
                  </strong>
                  {feedback.location && (
                    <span className={styles.authorMeta}>
                      · {feedback.location}
                    </span>
                  )}
                  {feedback.productName && (
                    <span className={styles.authorProduct}>
                      Sản phẩm: {feedback.productName}
                    </span>
                  )}
                  {feedback.date && (
                    <span className={styles.authorDate}>{feedback.date}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
