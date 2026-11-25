import clsx from 'clsx';
import type { CustomerFeedback } from '../../types/feedback';
import styles from './FeedbackSection.module.css';

export interface ReviewCardProps {
  readonly feedback: CustomerFeedback;
  readonly variant?: 'static' | 'ticker';
  readonly decorative?: boolean;
}

export function ReviewCard({
  feedback,
  variant = 'static',
  decorative = false,
}: ReviewCardProps) {
  const hasDate = Boolean(feedback.date?.trim());
  const cardClassName = clsx(
    styles.reviewCard,
    variant === 'ticker' ? styles.reviewCardTicker : styles.reviewCardStatic
  );

  const inner = (
    <>
      <div className={styles.reviewHeader}>
        <strong className={styles.authorName}>{feedback.authorName}</strong>
        {hasDate ? (
          <span className={styles.authorDate}>{feedback.date}</span>
        ) : null}
      </div>

      <p className={styles.reviewContent}>{feedback.content}</p>
    </>
  );

  if (decorative) {
    return (
      <div
        className={cardClassName}
        data-feedback-card="true"
        data-feedback-clone="true"
        data-variant={variant}
        aria-hidden="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <article
      className={cardClassName}
      data-feedback-card="true"
      data-feedback-canonical="true"
      data-feedback-id={feedback.id}
      data-variant={variant}
    >
      {inner}
    </article>
  );
}
