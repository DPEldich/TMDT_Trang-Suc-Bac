'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  animate,
  useReducedMotion,
  type AnimationPlaybackControls,
} from 'motion/react';
import type { Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import { FeaturedProductCard } from './FeaturedProducts';
import {
  applyBoundaryResistance,
  clampCoverflowIndex,
  COVERFLOW_AXIS_LOCK_PX,
  COVERFLOW_SPRING_BOUNCE,
  COVERFLOW_SPRING_DURATION_SEC,
  FALLBACK_COVERFLOW_METRICS,
  formatSelectionAnnouncement,
  getCoverflowSlot,
  getInitialCoverflowIndex,
  getSlideLayer,
  getSlidePose,
  parseCssAngleDeg,
  parseCssPositiveNumber,
  parseCssUnitInterval,
  resolveKeyboardIndex,
  resolveSnapIndex,
  type CoverflowMetrics,
} from './coverflowGeometry';
import styles from './FeaturedProducts.module.css';

export interface FeaturedCoverflowProps extends ComponentPropsWithoutRef<'div'> {
  products: readonly Product[];
  headingId?: string;
  ariaLabel?: string;
  headingAs?: 'h2' | 'h3';
}

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  deltaX: number;
  axis: 'pending' | 'horizontal';
}

const CLICK_SUPPRESSION_MS = 400;

function readCoverflowMetricsFromCss(
  root: HTMLElement,
  probe: HTMLElement
): CoverflowMetrics {
  const rootStyle = getComputedStyle(root);
  const probeStyle = getComputedStyle(probe);

  return {
    stepX: parseCssPositiveNumber(
      probeStyle.width,
      FALLBACK_COVERFLOW_METRICS.stepX
    ),
    farStepX: parseCssPositiveNumber(
      probeStyle.height,
      FALLBACK_COVERFLOW_METRICS.farStepX
    ),
    sideRotateY: parseCssAngleDeg(
      rootStyle.getPropertyValue('--coverflow-side-rotate-y-current'),
      FALLBACK_COVERFLOW_METRICS.sideRotateY
    ),
    farRotateY: parseCssAngleDeg(
      rootStyle.getPropertyValue('--coverflow-far-rotate-y-current'),
      FALLBACK_COVERFLOW_METRICS.farRotateY
    ),
    sideScale: parseCssPositiveNumber(
      rootStyle.getPropertyValue('--coverflow-side-scale-current'),
      FALLBACK_COVERFLOW_METRICS.sideScale
    ),
    farScale: parseCssPositiveNumber(
      rootStyle.getPropertyValue('--coverflow-far-scale'),
      FALLBACK_COVERFLOW_METRICS.farScale
    ),
    sideOpacity: parseCssUnitInterval(
      rootStyle.getPropertyValue('--coverflow-side-opacity-current'),
      FALLBACK_COVERFLOW_METRICS.sideOpacity
    ),
  };
}

export function FeaturedCoverflow({
  products,
  headingId,
  ariaLabel = 'Danh sách mẫu trang sức nổi bật',
  headingAs = 'h3',
  className,
  ...rest
}: FeaturedCoverflowProps) {
  const count = products.length;
  const reducedMotionPreference = useReducedMotion();
  const prefersReducedMotion = reducedMotionPreference === true;

  const [activeIndex, setActiveIndex] = useState<number>(() =>
    getInitialCoverflowIndex(count)
  );
  const [announcement, setAnnouncement] = useState<string>('');

  const safeActiveIndex = clampCoverflowIndex(activeIndex, count);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const activeAnimationsRef = useRef<AnimationPlaybackControls[]>([]);

  const activeIndexRef = useRef<number>(safeActiveIndex);
  const metricsRef = useRef<CoverflowMetrics>({ ...FALLBACK_COVERFLOW_METRICS });
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);
  const hydratedRef = useRef<boolean>(false);
  const dragSessionRef = useRef<DragSession | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef<number>(0);
  const pendingFocusTargetRef = useRef<'link' | 'stage' | null>(null);

  useEffect(() => {
    activeIndexRef.current = safeActiveIndex;
  }, [safeActiveIndex]);

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const stopActiveAnimations = useCallback(() => {
    const running = activeAnimationsRef.current;
    if (running.length === 0) return;
    for (const control of running) {
      control.stop();
    }
    activeAnimationsRef.current = [];
  }, []);

  const applyPoses = useCallback(
    (virtualIndex: number, instant: boolean) => {
      stopActiveAnimations();

      const metrics = metricsRef.current;
      const isReduced = reducedMotionRef.current;
      const useInstant = instant || isReduced;
      const transition = useInstant
        ? { duration: 0 }
        : {
            type: 'spring' as const,
            visualDuration: COVERFLOW_SPRING_DURATION_SEC,
            bounce: COVERFLOW_SPRING_BOUNCE,
          };

      const nextControls: AnimationPlaybackControls[] = [];

      for (let i = 0; i < count; i += 1) {
        const node = slideRefs.current[i];
        if (!node) continue;

        const offset = i - virtualIndex;
        const pose = getSlidePose(offset, metrics, isReduced);
        node.dataset.layer = pose.layer;

        const control = animate(
          node,
          {
            x: pose.x,
            rotateY: pose.rotateY,
            scale: pose.scale,
            opacity: pose.opacity,
          },
          transition
        );
        nextControls.push(control);
      }

      activeAnimationsRef.current = nextControls;
    },
    [count, stopActiveAnimations]
  );

  // Read resolved CSS geometry tokens on mount + resize and sync Motion transforms cleanly
  useEffect(() => {
    if (count === 0) return;

    const root = rootRef.current;
    const stage = stageRef.current;
    const probe = probeRef.current;
    const track = trackRef.current;
    if (!root || !stage || !probe || !track) return;

    const syncGeometry = () => {
      metricsRef.current = readCoverflowMetricsFromCss(root, probe);

      if (!dragSessionRef.current || dragSessionRef.current.axis !== 'horizontal') {
        applyPoses(activeIndexRef.current, true);
      }

      if (!hydratedRef.current) {
        hydratedRef.current = true;
        track.dataset.hydrated = 'true';
      }
    };

    syncGeometry();

    const handleWindowResize = () => {
      syncGeometry();
    };

    window.addEventListener('resize', handleWindowResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        syncGeometry();
      });
      observer.observe(stage);
      observer.observe(probe);
    }

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      observer?.disconnect();
    };
  }, [count, applyPoses]);

  // Animate smoothly when activeIndex or reduced-motion preference changes after hydration
  useEffect(() => {
    if (count === 0 || !hydratedRef.current) return;
    applyPoses(safeActiveIndex, prefersReducedMotion);
  }, [safeActiveIndex, count, prefersReducedMotion, applyPoses]);

  // Restore focus cleanly if the previously focused active link or disabled endpoint button changed
  useEffect(() => {
    const pending = pendingFocusTargetRef.current;
    if (!pending) return;
    pendingFocusTargetRef.current = null;

    if (pending === 'link') {
      activeLinkRef.current?.focus({ preventScroll: true });
    } else if (pending === 'stage') {
      stageRef.current?.focus({ preventScroll: true });
    }
  }, [safeActiveIndex]);

  // Cleanup rAF and animations on unmount
  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      stopActiveAnimations();
    };
  }, [stopActiveAnimations]);

  const selectIndex = useCallback(
    (
      targetIndex: number,
      options?: {
        announce?: boolean;
        focusTarget?: 'link' | 'stage' | null;
      }
    ) => {
      if (count <= 0) return;

      const clamped = clampCoverflowIndex(targetIndex, count);
      const current = activeIndexRef.current;

      if (clamped === current) {
        applyPoses(clamped, prefersReducedMotion);
        return;
      }

      activeIndexRef.current = clamped;

      if (options?.focusTarget) {
        pendingFocusTargetRef.current = options.focusTarget;
      }

      setActiveIndex(clamped);

      if (options?.announce !== false) {
        const selectedProduct = products[clamped];
        if (selectedProduct) {
          setAnnouncement(
            formatSelectionAnnouncement(
              selectedProduct,
              clamped,
              count,
              formatVND(selectedProduct.price)
            )
          );
        }
      }
    },
    [count, products, applyPoses, prefersReducedMotion]
  );

  const handleNavButtonClick = useCallback(
    (direction: -1 | 1) => {
      const nextIdx = clampCoverflowIndex(activeIndexRef.current + direction, count);
      const clickedButton =
        direction === -1 ? prevButtonRef.current : nextButtonRef.current;
      const willDisable =
        (direction === -1 && nextIdx === 0) ||
        (direction === 1 && nextIdx === count - 1);
      const keepKeyboardFocus =
        willDisable &&
        clickedButton !== null &&
        document.activeElement === clickedButton &&
        clickedButton.matches(':focus-visible');

      selectIndex(nextIdx, {
        announce: true,
        focusTarget: keepKeyboardFocus ? 'stage' : null,
      });
    },
    [count, selectIndex]
  );

  const handleSideSelect = useCallback(
    (index: number) => {
      if (performance.now() < suppressClickUntilRef.current) {
        return;
      }
      selectIndex(index, { announce: true });
    },
    [selectIndex]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (count <= 1 || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const nextIndex = resolveKeyboardIndex({
        key: event.key,
        activeIndex: activeIndexRef.current,
        count,
      });

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();

      const wasFocusedOnActiveLink =
        activeLinkRef.current !== null &&
        document.activeElement === activeLinkRef.current;

      selectIndex(nextIndex, {
        announce: true,
        focusTarget: wasFocusedOnActiveLink ? 'link' : null,
      });
    },
    [count, selectIndex]
  );

  const scheduleDragFrame = useCallback(() => {
    if (dragRafRef.current !== null) return;

    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const session = dragSessionRef.current;
      if (!session || session.axis !== 'horizontal') return;
      if (reducedMotionRef.current) return;

      const stepX = Math.max(1, metricsRef.current.stepX);
      const rawVirtual = activeIndexRef.current - session.deltaX / stepX;
      const resistedVirtual = applyBoundaryResistance(rawVirtual, count);

      applyPoses(resistedVirtual, true);
    });
  }, [count, applyPoses]);

  const finishDrag = useCallback(
    (pointerId: number, cancelled: boolean) => {
      const session = dragSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      dragSessionRef.current = null;

      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      const stage = stageRef.current;
      if (stage) {
        delete stage.dataset.dragging;
        try {
          if (stage.hasPointerCapture(pointerId)) {
            stage.releasePointerCapture(pointerId);
          }
        } catch {
          // Pointer capture may already have been released by the browser.
        }
      }

      if (session.axis !== 'horizontal') {
        return;
      }

      suppressClickUntilRef.current = performance.now() + CLICK_SUPPRESSION_MS;

      if (cancelled) {
        applyPoses(activeIndexRef.current, prefersReducedMotion);
        return;
      }

      const targetIndex = resolveSnapIndex({
        activeIndex: activeIndexRef.current,
        count,
        deltaX: session.deltaX,
        velocityX: session.velocityX,
        stepX: metricsRef.current.stepX,
      });

      if (targetIndex !== activeIndexRef.current) {
        selectIndex(targetIndex, { announce: true });
      } else {
        applyPoses(activeIndexRef.current, prefersReducedMotion);
      }
    },
    [count, applyPoses, prefersReducedMotion, selectIndex]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      suppressClickUntilRef.current = 0;

      if (count <= 1) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      dragSessionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocityX: 0,
        deltaX: 0,
        axis: 'pending',
      };
    },
    [count]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const session = dragSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const dx = event.clientX - session.startX;
      const dy = event.clientY - session.startY;

      if (session.axis === 'pending') {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < COVERFLOW_AXIS_LOCK_PX && absDy < COVERFLOW_AXIS_LOCK_PX) {
          return;
        }

        // Preserve vertical page scrolling whenever vertical gesture dominates
        if (absDy > absDx * 1.05) {
          dragSessionRef.current = null;
          return;
        }

        session.axis = 'horizontal';
        const stage = stageRef.current;
        if (stage) {
          stage.dataset.dragging = 'true';
          try {
            stage.setPointerCapture(event.pointerId);
          } catch {
            // Safe fallback if synthetic pointer event cannot be captured.
          }
        }
        stopActiveAnimations();
      }

      const now = performance.now();
      const dt = Math.max(1, now - session.lastTime);
      const instantVelocity = ((event.clientX - session.lastX) / dt) * 1000;
      session.velocityX = session.velocityX * 0.4 + instantVelocity * 0.6;
      session.lastX = event.clientX;
      session.lastTime = now;
      session.deltaX = dx;

      scheduleDragFrame();
    },
    [scheduleDragFrame, stopActiveAnimations]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishDrag(event.pointerId, false);
    },
    [finishDrag]
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishDrag(event.pointerId, true);
    },
    [finishDrag]
  );

  const handleStageClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (performance.now() < suppressClickUntilRef.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickUntilRef.current = 0;
      }
    },
    []
  );

  const handleStageDragStart = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  if (count === 0) {
    return (
      <div className={clsx(styles.emptyState, className)} role="status" {...rest}>
        <p className={styles.emptyStateText}>
          Hiện chưa có mẫu nổi bật để hiển thị.
        </p>
      </div>
    );
  }

  const isMultiItem = count > 1;
  const canGoPrev = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < count - 1;

  return (
    <div
      ref={rootRef}
      className={clsx(styles.coverflowRoot, className)}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : ariaLabel}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div
        ref={stageRef}
        className={styles.stageViewport}
        tabIndex={isMultiItem ? 0 : undefined}
        aria-label={
          isMultiItem
            ? 'Trình diễn mẫu nổi bật. Dùng phím mũi tên trái, phải, Home hoặc End để chuyển mẫu.'
            : undefined
        }
        data-interactive={isMultiItem ? 'true' : 'false'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleStageClickCapture}
        onDragStart={handleStageDragStart}
      >
        <div ref={probeRef} className={styles.geometryProbe} aria-hidden="true" />
        <div ref={trackRef} className={styles.stageTrack}>
          {products.map((product, index) => {
            const offset = index - safeActiveIndex;
            const slot = getCoverflowSlot(index, safeActiveIndex);
            const layer = getSlideLayer(offset);
            const isActive = index === safeActiveIndex;
            const isAdjacent = Math.abs(offset) === 1;
            const isHidden = Math.abs(offset) > 1;

            return (
              <div
                key={product.id}
                ref={(node) => {
                  slideRefs.current[index] = node;
                }}
                className={styles.slide}
                data-slot={slot}
                data-layer={layer}
                data-index={index}
                role={isActive ? 'group' : undefined}
                aria-roledescription={isActive ? 'slide' : undefined}
                aria-label={
                  isActive
                    ? `Mẫu ${index + 1} trên ${count}: ${product.name}`
                    : undefined
                }
                aria-hidden={isHidden ? true : undefined}
              >
                <FeaturedProductCard
                  product={product}
                  headingAs={headingAs}
                  isActive={isActive}
                  isPrioritizedImage={!isHidden}
                  actionLinkRef={isActive ? activeLinkRef : undefined}
                />

                {!isActive && isAdjacent && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className={styles.sideSelectOverlay}
                    aria-label={`Chọn mẫu ${product.name}`}
                    onClick={() => handleSideSelect(index)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isMultiItem && (
        <div
          className={styles.controlsBar}
          role="group"
          aria-label="Điều hướng mẫu trang sức nổi bật"
        >
          <div className={styles.controlsRow}>
            <button
              ref={prevButtonRef}
              type="button"
              className={styles.navButton}
              onClick={() => handleNavButtonClick(-1)}
              disabled={!canGoPrev}
              aria-label="Mẫu nổi bật trước"
            >
              <ChevronLeft className={styles.controlIcon} aria-hidden="true" />
            </button>

            <div
              className={styles.dotGroup}
              role="group"
              aria-label="Chọn nhanh từng mẫu nổi bật"
            >
              {products.map((product, index) => {
                const isSelected = index === safeActiveIndex;
                return (
                  <button
                    key={product.id}
                    type="button"
                    className={styles.dotButton}
                    aria-label={`Chọn mẫu ${index + 1}: ${product.name}`}
                    aria-pressed={isSelected}
                    onClick={() => selectIndex(index, { announce: true })}
                  >
                    <span className={styles.dotPill} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <button
              ref={nextButtonRef}
              type="button"
              className={styles.navButton}
              onClick={() => handleNavButtonClick(1)}
              disabled={!canGoNext}
              aria-label="Mẫu nổi bật tiếp theo"
            >
              <ChevronRight className={styles.controlIcon} aria-hidden="true" />
            </button>
          </div>

          <span className={styles.counter} aria-hidden="true">
            {safeActiveIndex + 1} / {count}
          </span>
        </div>
      )}
    </div>
  );
}
