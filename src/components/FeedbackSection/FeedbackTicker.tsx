'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from 'react';
import { BookOpen, Play } from 'lucide-react';
import { animate, type AnimationPlaybackControls } from 'motion/react';
import type { CustomerFeedback } from '../../types/feedback';
import { FeedbackHeader } from './FeedbackHeader';
import { ReviewCard } from './ReviewCard';
import {
  buildTickerLanes,
  computeRequiredGroupCount,
  FEEDBACK_BREAKPOINT_2COL,
  FEEDBACK_BREAKPOINT_3COL,
  FEEDBACK_BREAKPOINT_5COL,
  MIN_TICKER_REVIEWS,
  normalizeProgress,
  type TickerColumnCount,
} from './feedbackTickerLayout';
import styles from './FeedbackSection.module.css';

export interface FeedbackTickerProps {
  readonly feedbacks: readonly CustomerFeedback[];
}

interface ActiveLaneAnimation {
  readonly control: AnimationPlaybackControls;
  readonly cycleHeight: number;
  readonly duration: number;
}

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

function useLiveReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

function subscribeColumnCount(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const queries = [
    window.matchMedia(FEEDBACK_BREAKPOINT_2COL),
    window.matchMedia(FEEDBACK_BREAKPOINT_3COL),
    window.matchMedia(FEEDBACK_BREAKPOINT_5COL),
  ];
  for (const query of queries) {
    query.addEventListener('change', onStoreChange);
  }
  return () => {
    for (const query of queries) {
      query.removeEventListener('change', onStoreChange);
    }
  };
}

function getColumnCountSnapshot(): TickerColumnCount {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 1;
  }
  if (window.matchMedia(FEEDBACK_BREAKPOINT_5COL).matches) return 5;
  if (window.matchMedia(FEEDBACK_BREAKPOINT_3COL).matches) return 3;
  if (window.matchMedia(FEEDBACK_BREAKPOINT_2COL).matches) return 2;
  return 1;
}

function useTickerColumnCount(): TickerColumnCount {
  return useSyncExternalStore(
    subscribeColumnCount,
    getColumnCountSnapshot,
    () => 1
  );
}

const DEFAULT_GROUP_COUNTS: readonly number[] = [2, 2, 2, 2, 2];

export function FeedbackTicker({ feedbacks }: FeedbackTickerProps) {
  const panelId = useId();
  const isHydrated = useIsHydrated();
  const prefersReducedMotion = useLiveReducedMotion();
  const columnCount = useTickerColumnCount();

  const [isReaderMode, setIsReaderMode] = useState(false);
  const [groupCounts, setGroupCounts] = useState<readonly number[]>(DEFAULT_GROUP_COUNTS);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<Array<HTMLDivElement | null>>([]);
  const group0Refs = useRef<Array<HTMLDivElement | null>>([]);
  const group1Refs = useRef<Array<HTMLDivElement | null>>([]);
  const laneAnimationsRef = useRef<Array<ActiveLaneAnimation | null>>([]);
  const laneProgressRef = useRef<number[]>([]);

  const isHoverPausedRef = useRef(false);
  const isOffscreenRef = useRef(false);
  const isHiddenRef = useRef(false);

  const shouldRenderTicker =
    isHydrated &&
    feedbacks.length >= MIN_TICKER_REVIEWS &&
    !prefersReducedMotion &&
    !isReaderMode;

  const lanes = useMemo(
    () =>
      shouldRenderTicker ? buildTickerLanes(feedbacks, columnCount) : [],
    [shouldRenderTicker, feedbacks, columnCount]
  );

  const syncPlayback = useCallback(() => {
    const shouldPause =
      isHoverPausedRef.current ||
      isOffscreenRef.current ||
      isHiddenRef.current;

    const viewport = viewportRef.current;
    if (viewport) {
      viewport.dataset.paused = shouldPause ? 'true' : 'false';
      viewport.dataset.pauseReason = isHoverPausedRef.current
        ? 'hover'
        : isHiddenRef.current
          ? 'hidden'
          : isOffscreenRef.current
            ? 'offscreen'
            : 'none';
    }

    for (const entry of laneAnimationsRef.current) {
      if (!entry) continue;
      if (shouldPause) {
        entry.control.pause();
      } else {
        entry.control.play();
      }
    }
  }, []);

  const cancelAllAnimations = useCallback((preserveProgress: boolean) => {
    const current = laneAnimationsRef.current;
    for (let i = 0; i < current.length; i += 1) {
      const entry = current[i];
      if (!entry) continue;
      if (preserveProgress) {
        laneProgressRef.current[i] = normalizeProgress(
          entry.control.time,
          entry.duration
        );
      }
      entry.control.cancel();
      current[i] = null;
    }
  }, []);

  useEffect(() => {
    if (!shouldRenderTicker || lanes.length === 0) {
      isHoverPausedRef.current = false;
      cancelAllAnimations(false);
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let cancelled = false;
    let rafId: number | null = null;
    isHiddenRef.current = typeof document !== 'undefined' && document.hidden;

    const measureAndSync = () => {
      if (cancelled) return;
      const currentViewport = viewportRef.current;
      if (!currentViewport) return;

      const viewportHeight = currentViewport.getBoundingClientRect().height;
      if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
        currentViewport.dataset.animationReady = 'false';
        return;
      }

      const measuredCycleHeights: number[] = [];
      let nextGroupCounts: number[] | null = null;

      for (let i = 0; i < lanes.length; i += 1) {
        const group0 = group0Refs.current[i];
        const group1 = group1Refs.current[i];
        if (!group0 || !group1) {
          currentViewport.dataset.animationReady = 'false';
          return;
        }

        const cycleHeight =
          group1.getBoundingClientRect().top - group0.getBoundingClientRect().top;
        if (!Number.isFinite(cycleHeight) || cycleHeight <= 0) {
          currentViewport.dataset.animationReady = 'false';
          return;
        }

        measuredCycleHeights[i] = cycleHeight;
        const requiredGroups = computeRequiredGroupCount(
          viewportHeight,
          cycleHeight
        );
        const currentGroups = groupCounts[i] ?? 2;
        if (requiredGroups > currentGroups) {
          if (!nextGroupCounts) {
            nextGroupCounts = Array.from(groupCounts);
          }
          nextGroupCounts[i] = requiredGroups;
        }
      }

      if (nextGroupCounts) {
        setGroupCounts(nextGroupCounts);
        return;
      }

      for (let i = 0; i < lanes.length; i += 1) {
        const lane = lanes[i];
        const track = trackRefs.current[i];
        const cycleHeight = measuredCycleHeights[i];
        if (!lane || !track || !cycleHeight) continue;

        const existing = laneAnimationsRef.current[i];
        if (existing && Math.abs(existing.cycleHeight - cycleHeight) < 0.5) {
          continue;
        }

        let phase = laneProgressRef.current[i] ?? lane.initialPhase;
        if (existing) {
          phase = normalizeProgress(existing.control.time, existing.duration);
          laneProgressRef.current[i] = phase;
          existing.control.cancel();
          laneAnimationsRef.current[i] = null;
        } else {
          laneProgressRef.current[i] = phase;
        }

        const duration = cycleHeight / lane.speedPxPerSec;
        const fromY = lane.direction === 'up' ? 0 : -cycleHeight;
        const toY = lane.direction === 'up' ? -cycleHeight : 0;

        const control = animate(
          track,
          {
            transform: [
              `translate3d(0px, ${fromY}px, 0px)`,
              `translate3d(0px, ${toY}px, 0px)`,
            ],
          },
          {
            duration,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          }
        );

        control.time = phase * duration;
        laneAnimationsRef.current[i] = {
          control,
          cycleHeight,
          duration,
        };
      }

      currentViewport.dataset.animationReady = 'true';
      syncPlayback();
    };

    const scheduleMeasure = () => {
      if (cancelled || rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        measureAndSync();
      });
    };

    scheduleMeasure();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserver.observe(viewport);
      for (let i = 0; i < lanes.length; i += 1) {
        const group0 = group0Refs.current[i];
        if (group0) {
          resizeObserver.observe(group0);
        }
      }
    }

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          isOffscreenRef.current = !entry.isIntersecting;
          syncPlayback();
        },
        {
          rootMargin: '80px 0px',
          threshold: 0,
        }
      );
      intersectionObserver.observe(viewport);
    }

    const handleVisibilityChange = () => {
      isHiddenRef.current = document.hidden;
      syncPlayback();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        scheduleMeasure();
      });
    }

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAllAnimations(true);
    };
  }, [
    shouldRenderTicker,
    lanes,
    groupCounts,
    syncPlayback,
    cancelAllAnimations,
  ]);

  const handleViewportPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    isHoverPausedRef.current = true;
    syncPlayback();
  };

  const handleViewportPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    isHoverPausedRef.current = false;
    syncPlayback();
  };

  const handleToggleReaderMode = () => {
    isHoverPausedRef.current = false;
    setIsReaderMode((prev) => !prev);
  };

  const feedbackMode = !isHydrated
    ? 'static-ssr'
    : prefersReducedMotion
      ? 'static-reduced-motion'
      : isReaderMode
        ? 'static-reader'
        : 'ticker';

  const readerControl =
    isHydrated && !prefersReducedMotion ? (
      <button
        type="button"
        className={styles.readerToggle}
        data-feedback-reader-toggle="true"
        data-state={isReaderMode ? 'reader' : 'ticker'}
        aria-pressed={isReaderMode}
        aria-controls={panelId}
        onClick={handleToggleReaderMode}
      >
        {isReaderMode ? (
          <>
            <Play className={styles.toggleIcon} aria-hidden="true" />
            <span>Bật hiệu ứng</span>
          </>
        ) : (
          <>
            <BookOpen className={styles.toggleIcon} aria-hidden="true" />
            <span>Đọc đánh giá</span>
          </>
        )}
      </button>
    ) : null;

  return (
    <div
      className={styles.tickerRoot}
      data-feedback-root="true"
      data-feedback-mode={feedbackMode}
      data-feedback-count={feedbacks.length}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <FeedbackHeader actionSlot={readerControl} />

      <div id={panelId} className={styles.stageShell} data-mode={feedbackMode}>
        {shouldRenderTicker ? (
          <div
            ref={viewportRef}
            className={styles.tickerViewport}
            data-feedback-viewport="true"
            data-columns={columnCount}
            data-animation-ready="false"
            data-paused="false"
            onPointerEnter={handleViewportPointerEnter}
            onPointerLeave={handleViewportPointerLeave}
          >
            {lanes.map((lane) => {
              const copies = groupCounts[lane.laneIndex] ?? 2;

              return (
                <div
                  key={`lane-${columnCount}-${lane.laneIndex}`}
                  className={styles.tickerLane}
                  data-feedback-lane={lane.laneIndex}
                  data-direction={lane.direction}
                >
                  <div
                    ref={(node) => {
                      trackRefs.current[lane.laneIndex] = node;
                    }}
                    className={styles.tickerTrack}
                    data-feedback-track={lane.laneIndex}
                  >
                    {Array.from({ length: copies }, (_, groupIndex) => {
                      const isCloneGroup = groupIndex > 0;

                      return (
                        <div
                          key={`group-${lane.laneIndex}-${groupIndex}`}
                          ref={(node) => {
                            if (groupIndex === 0) {
                              group0Refs.current[lane.laneIndex] = node;
                            } else if (groupIndex === 1) {
                              group1Refs.current[lane.laneIndex] = node;
                            }
                          }}
                          className={styles.tickerGroup}
                          data-feedback-group={groupIndex}
                          aria-hidden={isCloneGroup ? 'true' : undefined}
                        >
                          {lane.items.map((item) => (
                            <ReviewCard
                              key={`${groupIndex}-${item.key}`}
                              feedback={item.feedback}
                              variant="ticker"
                              decorative={isCloneGroup || !item.isCanonical}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={styles.feedbackGrid}
            data-feedback-static-grid="true"
            data-count={feedbacks.length === 1 ? '1' : 'multiple'}
          >
            {feedbacks.map((feedback) => (
              <ReviewCard
                key={feedback.id}
                feedback={feedback}
                variant="static"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
