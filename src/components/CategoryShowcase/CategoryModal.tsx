'use client';

import {
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  isModifiedAnchorActivation,
  resolveCategoryMotionConfig,
  resolveFocusTrapTarget,
  type CategoryShowcaseItem,
} from './categoryShowcaseData';
import styles from './CategoryShowcase.module.css';

export interface CategoryModalProps {
  readonly item: CategoryShowcaseItem;
  readonly prefersReducedMotion: boolean;
  readonly onRequestClose: (restoreFocus: boolean) => void;
  readonly onNavigateCta: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function CategoryModal({
  item,
  prefersReducedMotion,
  onRequestClose,
  onNavigateCta,
}: CategoryModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointerDownInsideDialogRef = useRef(false);

  const motionConfig = resolveCategoryMotionConfig(prefersReducedMotion);
  const shared = motionConfig.enableSharedLayout;

  // Initial focus on close button + Escape key & bidirectional Tab focus trap
  useEffect(() => {
    const closeEl = closeButtonRef.current;
    let rafId: number | null = null;

    if (closeEl) {
      closeEl.focus({ preventScroll: true });
    }
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const target = closeButtonRef.current;
      if (target && dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
        target.focus({ preventScroll: true });
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onRequestClose(true);
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

        const activeIndex = focusable.findIndex((el) => el === document.activeElement);
        const nextIndex = resolveFocusTrapTarget({
          focusableCount: focusable.length,
          activeIndex,
          shiftKey: event.shiftKey,
        });

        if (nextIndex !== null) {
          event.preventDefault();
          focusable[nextIndex]?.focus({ preventScroll: true });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onRequestClose]);

  const handleViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const targetNode = event.target instanceof Node ? event.target : null;
    pointerDownInsideDialogRef.current = Boolean(
      targetNode && dialogRef.current?.contains(targetNode)
    );
  };

  const handleViewportClick = (event: MouseEvent<HTMLDivElement>) => {
    const targetNode = event.target instanceof Node ? event.target : null;
    const clickedInsideDialog = Boolean(
      targetNode && dialogRef.current?.contains(targetNode)
    );
    const startedInsideDialog = pointerDownInsideDialogRef.current;
    pointerDownInsideDialogRef.current = false;

    if (!clickedInsideDialog && !startedInsideDialog) {
      onRequestClose(true);
    }
  };

  const titleId = `category-modal-title-${item.id}`;
  const descriptionId = `category-modal-desc-${item.id}`;

  return (
    <motion.div
      layoutRoot
      className={styles.modalViewport}
      data-category-modal-viewport="true"
      data-category-id={item.id}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      onPointerDown={handleViewportPointerDown}
      onClick={handleViewportClick}
    >
      <motion.div
        className={styles.modalBackdrop}
        data-category-modal-backdrop="true"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionConfig.backdropTransition}
      />

      <div className={styles.modalPositioner}>
        <motion.article
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          layoutId={shared ? `category-shell-${item.id}` : undefined}
          className={styles.modalDialog}
          data-tone={item.tone}
          data-category-modal="true"
          data-category-id={item.id}
          initial={shared ? undefined : { opacity: 0 }}
          animate={shared ? undefined : { opacity: 1 }}
          exit={shared ? undefined : { opacity: 0 }}
          transition={motionConfig.shellTransition}
          onClick={(event) => event.stopPropagation()}
        >
          <motion.button
            ref={closeButtonRef}
            type="button"
            layout={shared ? 'position' : false}
            className={styles.closeButton}
            data-tone={item.tone}
            data-category-modal-close="true"
            aria-label={`Đóng giới thiệu danh mục ${item.label}`}
            onClick={() => onRequestClose(true)}
            initial={shared ? { opacity: 0, scale: 0.9 } : { opacity: 0 }}
            animate={shared ? { opacity: 1, scale: 1 } : { opacity: 1 }}
            exit={shared ? { opacity: 0, scale: 0.9 } : { opacity: 0 }}
            transition={motionConfig.closeButtonTransition}
          >
            <X className={styles.closeIcon} aria-hidden="true" />
          </motion.button>

          <motion.div
            layoutScroll
            className={styles.modalScroller}
            data-category-modal-scroller="true"
          >
            <div className={styles.modalScrollInner}>
              <motion.div
                layoutId={shared ? `category-stage-${item.id}` : undefined}
                className={styles.modalStage}
                data-tone={item.tone}
                data-framing={item.framing}
                transition={motionConfig.shellTransition}
              >
                <motion.div
                  layoutId={shared ? `category-media-${item.id}` : undefined}
                  className={styles.modalMedia}
                  data-framing={item.framing}
                  transition={motionConfig.shellTransition}
                >
                  <Image
                    src={item.previewImage}
                    alt={item.previewImageAlt}
                    width={300}
                    height={300}
                    sizes="(max-width: 48rem) 280px, 300px"
                    priority
                    className={styles.modalImage}
                    data-framing={item.framing}
                    data-tone={item.tone}
                  />
                </motion.div>

                <motion.div
                  layoutId={shared ? `category-heading-${item.id}` : undefined}
                  layout={shared ? 'position' : false}
                  className={styles.modalStageCopy}
                  transition={motionConfig.shellTransition}
                >
                  <span className={styles.modalEyebrow}>{item.label}</span>
                  <h3 id={titleId} className={styles.modalHeadline}>
                    {item.headline}
                  </h3>
                </motion.div>
              </motion.div>

              <motion.div
                id={descriptionId}
                className={styles.modalBody}
                data-category-modal-body="true"
                initial={shared ? { opacity: 0, y: 12 } : { opacity: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: motionConfig.bodyEnterTransition,
                }}
                exit={
                  shared
                    ? {
                        opacity: 0,
                        y: 8,
                        transition: motionConfig.bodyExitTransition,
                      }
                    : {
                        opacity: 0,
                        transition: motionConfig.bodyExitTransition,
                      }
                }
              >
                <div className={styles.modalParagraphs}>
                  {item.paragraphs.map((paragraph, index) => (
                    <p key={index} className={styles.modalParagraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {item.note ? (
                  <p className={styles.modalNote} data-category-modal-note="true">
                    {item.note}
                  </p>
                ) : null}

                <div className={styles.modalFooter}>
                  <Link
                    href={item.href}
                    className={styles.modalCta}
                    data-category-modal-cta="true"
                    onClick={(event) => {
                      if (!isModifiedAnchorActivation(event)) {
                        onNavigateCta();
                      }
                    }}
                  >
                    <span>{item.ctaLabel}</span>
                    <ArrowUpRight
                      className={styles.modalCtaIcon}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.article>
      </div>
    </motion.div>
  );
}
