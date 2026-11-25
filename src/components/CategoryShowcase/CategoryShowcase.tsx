'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import type { ProductCategory } from '../../types/product';
import { CategoryModal } from './CategoryModal';
import {
  CATEGORY_SHOWCASE_EXIT_FALLBACK_MS,
  isModifiedAnchorActivation,
  resolveCategoryMotionConfig,
  resolveScrollLockCompensation,
  type CategoryShowcaseItem,
} from './categoryShowcaseData';
import styles from './CategoryShowcase.module.css';

export interface CategoryShowcaseProps extends ComponentPropsWithoutRef<'div'> {
  readonly items: readonly CategoryShowcaseItem[];
}

interface SavedInertState {
  readonly element: HTMLElement;
  readonly hadInertAttr: boolean;
  readonly prevInertAttr: string | null;
}

const IGNORED_PORTAL_SIBLING_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
  'LINK',
  'META',
  'NEXT-ROUTE-ANNOUNCER',
]);

const emptySubscribe = () => () => {};

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function useLiveReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

function restoreInlineStyleProperty(
  element: HTMLElement,
  property: string,
  previousValue: string
): void {
  if (previousValue) {
    element.style.setProperty(property, previousValue);
  } else {
    element.style.removeProperty(property);
  }
}

export function CategoryShowcase({
  items,
  className,
  ...rest
}: CategoryShowcaseProps) {
  const isHydrated = useIsHydrated();
  const prefersReducedMotion = useLiveReducedMotion();

  const [activeId, setActiveId] = useState<ProductCategory | null>(null);
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);
  const [returningId, setReturningId] = useState<ProductCategory | null>(null);

  const activeIdRef = useRef<ProductCategory | null>(null);
  const lastOpenedIdRef = useRef<ProductCategory | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const portalRootRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<ProductCategory, HTMLAnchorElement | null>>>({});

  const activeItem = activeId
    ? items.find((item) => item.id === activeId) ?? null
    : null;

  const motionConfig = resolveCategoryMotionConfig(prefersReducedMotion);
  const shared = motionConfig.enableSharedLayout;

  const openCategory = useCallback((categoryId: ProductCategory) => {
    activeIdRef.current = categoryId;
    lastOpenedIdRef.current = categoryId;
    shouldRestoreFocusRef.current = false;
    setReturningId(null);
    setIsBackgroundLocked(true);
    setActiveId(categoryId);
  }, []);

  const requestCloseCategory = useCallback((restoreFocus: boolean) => {
    const closingId = activeIdRef.current;
    if (!closingId) {
      return;
    }
    activeIdRef.current = null;
    shouldRestoreFocusRef.current = restoreFocus;
    setReturningId(closingId);
    setActiveId(null);
  }, []);

  const handleNavigateCta = useCallback(() => {
    shouldRestoreFocusRef.current = false;
  }, []);

  const finalizeClose = useCallback(() => {
    if (activeIdRef.current !== null) {
      return;
    }
    setIsBackgroundLocked(false);
    setReturningId(null);
  }, []);

  // Defensive safety timer so rapid toggles or dropped animation frames can never leave background stuck locked
  useEffect(() => {
    if (!isBackgroundLocked || activeId !== null) {
      return;
    }

    const timerId = window.setTimeout(() => {
      finalizeClose();
    }, CATEGORY_SHOWCASE_EXIT_FALLBACK_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isBackgroundLocked, activeId, finalizeClose]);

  // Manage background inert (including fixed header) & scroll lock with scrollbar gutter compensation
  useEffect(() => {
    if (!isBackgroundLocked) {
      return;
    }

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const portalEl = portalRootRef.current;

    const prevHtmlOverflow = htmlEl.style.getPropertyValue('overflow');
    const prevBodyOverflow = bodyEl.style.getPropertyValue('overflow');
    const prevBodyPaddingRight = bodyEl.style.getPropertyValue('padding-right');

    const scrollbarWidth = resolveScrollLockCompensation(
      window.innerWidth,
      htmlEl.clientWidth
    );

    const fixedHeader = document.querySelector<HTMLElement>(
      'header[data-overlay="true"]'
    );
    const prevHeaderPaddingRight = fixedHeader
      ? fixedHeader.style.getPropertyValue('padding-right')
      : '';

    const baseBodyPaddingRight =
      Number.parseFloat(getComputedStyle(bodyEl).paddingRight) || 0;
    const baseHeaderPaddingRight = fixedHeader
      ? Number.parseFloat(getComputedStyle(fixedHeader).paddingRight) || 0
      : 0;

    // 1. Lock scrolling without horizontal shift or scroll-position jump
    htmlEl.style.setProperty('overflow', 'hidden');
    bodyEl.style.setProperty('overflow', 'hidden');

    if (scrollbarWidth > 0) {
      bodyEl.style.setProperty(
        'padding-right',
        `${baseBodyPaddingRight + scrollbarWidth}px`
      );
      if (fixedHeader) {
        fixedHeader.style.setProperty(
          'padding-right',
          `${baseHeaderPaddingRight + scrollbarWidth}px`
        );
      }
    }

    // 2. Mark background siblings (header, pageWrapper, footer) inert while preserving prior state
    const savedInerts: SavedInertState[] = [];
    for (const child of Array.from(bodyEl.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child === portalEl || child.hasAttribute('data-category-modal-portal')) {
        continue;
      }
      if (IGNORED_PORTAL_SIBLING_TAGS.has(child.tagName.toUpperCase())) {
        continue;
      }

      const hadInertAttr = child.hasAttribute('inert');
      const prevInertAttr = child.getAttribute('inert');
      savedInerts.push({ element: child, hadInertAttr, prevInertAttr });
      child.setAttribute('inert', '');
    }

    return () => {
      // Restore inert FIRST so focus restoration can succeed on the original card trigger
      for (const saved of savedInerts) {
        if (saved.hadInertAttr) {
          saved.element.setAttribute('inert', saved.prevInertAttr ?? '');
        } else {
          saved.element.removeAttribute('inert');
        }
      }

      restoreInlineStyleProperty(htmlEl, 'overflow', prevHtmlOverflow);
      restoreInlineStyleProperty(bodyEl, 'overflow', prevBodyOverflow);
      restoreInlineStyleProperty(bodyEl, 'padding-right', prevBodyPaddingRight);

      if (fixedHeader) {
        restoreInlineStyleProperty(
          fixedHeader,
          'padding-right',
          prevHeaderPaddingRight
        );
      }
    };
  }, [isBackgroundLocked]);

  // Restore focus to the original grid card AFTER inert & scroll lock have cleaned up
  useEffect(() => {
    if (isBackgroundLocked || activeId !== null || !shouldRestoreFocusRef.current) {
      return;
    }

    shouldRestoreFocusRef.current = false;
    const targetId = lastOpenedIdRef.current;
    if (!targetId) {
      return;
    }

    const triggerEl = triggerRefs.current[targetId];
    if (triggerEl && triggerEl.isConnected) {
      triggerEl.focus({ preventScroll: true });
    }
  }, [isBackgroundLocked, activeId]);

  const handleCardClick = (
    categoryId: ProductCategory,
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    if (isModifiedAnchorActivation(event)) {
      return;
    }
    event.preventDefault();
    openCategory(categoryId);
  };

  const handleCardKeyDown = (
    categoryId: ProductCategory,
    event: KeyboardEvent<HTMLAnchorElement>
  ) => {
    if (event.key === ' ') {
      event.preventDefault();
      openCategory(categoryId);
    }
  };

  return (
    <LayoutGroup id="nfa-category-showcase">
      <div
        className={clsx(styles.showcase, className)}
        data-category-showcase="true"
        data-active-category={activeId ?? ''}
        data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
        {...rest}
      >
        <div className={styles.grid} data-category-grid="true">
          {items.map((item) => {
            const isOpen = activeId === item.id;
            const isReturning = returningId === item.id && !isOpen;

            return (
              <div
                key={item.id}
                className={styles.cardSlot}
                data-category-slot={item.id}
                data-featured={item.featured ? 'true' : 'false'}
              >
                {isOpen ? (
                  <div
                    className={styles.cardPlaceholder}
                    data-category-placeholder={item.id}
                    aria-hidden="true"
                  />
                ) : (
                  <motion.div
                    layoutId={shared ? `category-shell-${item.id}` : undefined}
                    className={styles.cardShell}
                    data-returning={isReturning ? 'true' : 'false'}
                    transition={motionConfig.shellTransition}
                  >
                    <a
                      ref={(node) => {
                        triggerRefs.current[item.id] = node;
                      }}
                      href={item.href}
                      className={styles.cardTrigger}
                      data-category-card={item.id}
                      data-tone={item.tone}
                      aria-haspopup="dialog"
                      aria-expanded={false}
                      aria-label={`${item.label}: ${item.headline}`}
                      onClick={(event) => handleCardClick(item.id, event)}
                      onKeyDown={(event) => handleCardKeyDown(item.id, event)}
                    >
                      <motion.div
                        layoutId={shared ? `category-stage-${item.id}` : undefined}
                        className={styles.cardStage}
                        data-tone={item.tone}
                        data-framing={item.framing}
                        transition={motionConfig.shellTransition}
                      >
                        <motion.div
                          layoutId={shared ? `category-media-${item.id}` : undefined}
                          className={styles.cardMedia}
                          data-framing={item.framing}
                          transition={motionConfig.shellTransition}
                        >
                          <Image
                            src={item.previewImage}
                            alt={item.previewImageAlt}
                            width={300}
                            height={300}
                            sizes={
                              item.featured
                                ? '(max-width: 48rem) 240px, 300px'
                                : '(max-width: 48rem) 240px, 280px'
                            }
                            loading="lazy"
                            className={styles.cardImage}
                            data-framing={item.framing}
                            data-tone={item.tone}
                          />
                        </motion.div>

                        <motion.div
                          layoutId={shared ? `category-heading-${item.id}` : undefined}
                          layout={shared ? 'position' : false}
                          className={styles.cardCopy}
                          transition={motionConfig.shellTransition}
                        >
                          <span className={styles.cardEyebrow}>{item.label}</span>
                          <h3 className={styles.cardHeadline}>{item.headline}</h3>
                        </motion.div>
                      </motion.div>
                    </a>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {isHydrated
          ? createPortal(
              <div
                ref={portalRootRef}
                data-category-modal-portal="true"
              >
                <AnimatePresence onExitComplete={finalizeClose}>
                  {activeItem ? (
                    <CategoryModal
                      key={`category-modal-${activeItem.id}`}
                      item={activeItem}
                      prefersReducedMotion={prefersReducedMotion}
                      onRequestClose={requestCloseCategory}
                      onNavigateCta={handleNavigateCta}
                    />
                  ) : null}
                </AnimatePresence>
              </div>,
              document.body
            )
          : null}
      </div>
    </LayoutGroup>
  );
}
