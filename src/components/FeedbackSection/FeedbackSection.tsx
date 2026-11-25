import { ExternalLink, MessageSquareQuote } from 'lucide-react';
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
            {feedbacks.map((feedback) => {
              const hasDate = Boolean(feedback.date?.trim());

              return (
                <article key={feedback.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <strong className={styles.authorName}>
                      {feedback.authorName}
                    </strong>
                    {hasDate && (
                      <span className={styles.authorDate}>{feedback.date}</span>
                    )}
                  </div>

                  <p className={styles.reviewContent}>{feedback.content}</p>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
