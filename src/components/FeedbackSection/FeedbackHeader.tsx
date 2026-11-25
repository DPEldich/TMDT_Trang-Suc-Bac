import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { FEEDBACK_FORM_URL } from '../../data/feedback';
import { LinkButton } from '../UI/Button';
import styles from './FeedbackSection.module.css';

export interface FeedbackHeaderProps {
  readonly actionSlot?: ReactNode;
}

export function FeedbackHeader({ actionSlot }: FeedbackHeaderProps) {
  return (
    <div className={styles.header} data-feedback-header="true">
      <div className={styles.headerCopy}>
        <h2 id="feedback-heading" className={styles.heading}>
          Đánh giá từ khách hàng
        </h2>
      </div>

      <div className={styles.headerActions} data-feedback-header-actions="true">
        {actionSlot}
        <LinkButton
          href={FEEDBACK_FORM_URL}
          variant="outline"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.feedbackLink}
          data-feedback-submit-link="true"
        >
          <span>Gửi đánh giá</span>
          <ExternalLink className={styles.externalIcon} aria-hidden="true" />
        </LinkButton>
      </div>
    </div>
  );
}
