import { MessageSquareQuote } from 'lucide-react';
import type { CustomerFeedback } from '../../types/feedback';
import { Container } from '../UI/Container';
import { FeedbackHeader } from './FeedbackHeader';
import { FeedbackTicker } from './FeedbackTicker';
import { MIN_TICKER_REVIEWS } from './feedbackTickerLayout';
import { ReviewCard } from './ReviewCard';
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
  const shouldUseTicker = feedbacks.length >= MIN_TICKER_REVIEWS;

  return (
    <section className={styles.section} aria-labelledby="feedback-heading">
      <Container>
        {!hasFeedback ? (
          <>
            <FeedbackHeader />
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
          </>
        ) : shouldUseTicker ? (
          <FeedbackTicker feedbacks={feedbacks} />
        ) : (
          <>
            <FeedbackHeader />
            <div
              className={styles.stageShell}
              data-feedback-mode="static-under-threshold"
              data-feedback-count={feedbacks.length}
            >
              <div
                className={styles.feedbackGrid}
                data-feedback-static-grid="true"
                data-count={String(feedbacks.length)}
              >
                {feedbacks.map((feedback) => (
                  <ReviewCard
                    key={feedback.id}
                    feedback={feedback}
                    variant="static"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
