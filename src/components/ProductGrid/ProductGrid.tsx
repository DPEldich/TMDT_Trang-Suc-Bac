'use client';

import { Component, type ReactNode } from 'react';
import { animate, type AnimationPlaybackControls } from 'motion/react';
import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard';
import { Button } from '../UI/Button';
import styles from './ProductGrid.module.css';

export interface ProductGridProps {
  products: readonly Product[];
  searchQuery?: string;
  headingAs?: 'h2' | 'h3';
  emptyMessage?: string;
  onResetFilter?: () => void;
  resetLabel?: string;
}

interface CellBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface ShuffleSnapshot {
  readonly shouldAnimate: boolean;
  readonly prevBoxes: ReadonlyMap<string, CellBox>;
}

type ActiveCellAnimation =
  | {
      readonly kind: 'moving';
      readonly element: HTMLDivElement;
      readonly dx: number;
      readonly dy: number;
      readonly peakBlur: number;
      readonly exponent: number;
    }
  | {
      readonly kind: 'entering';
      readonly element: HTMLDivElement;
      readonly offsetY: number;
      readonly startScale: number;
      readonly peakBlur: number;
      readonly exponent: number;
    }
  | {
      readonly kind: 'settling';
      readonly element: HTMLDivElement;
      readonly offsetY: number;
      readonly startScale: number;
      readonly peakBlur: number;
      readonly exponent: number;
    };

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SHUFFLE_DURATION_SEC = 0.3;
const SHUFFLE_SAFETY_TIMEOUT_MS = 360;
const MIN_MOVE_DISTANCE_PX = 1;
const ENTER_OFFSET_Y_PX = 14;
const ENTER_START_SCALE = 0.978;
const ENTER_PEAK_BLUR_PX = 2.4;
const SETTLE_OFFSET_Y_PX = 8;
const SETTLE_START_SCALE = 0.986;
const SETTLE_PEAK_BLUR_PX = 1.8;

function isReducedMotionPreferred(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getProductsKey(products: readonly Product[]): string {
  return products.map((product) => product.id).join('\u0000');
}

function computeEaseOut(progress: number, exponent: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  return 1 - Math.pow(1 - progress, exponent);
}

function computeBlurEnvelope(progress: number): number {
  if (progress >= 1) return 0;
  const clamped = progress <= 0 ? 0 : progress;
  return Math.max(0, Math.sin(Math.PI * (0.18 + 0.82 * clamped)));
}

export class ProductGrid extends Component<ProductGridProps> {
  private gridElement: HTMLDivElement | null = null;
  private readonly cellElements = new Map<string, HTMLDivElement>();
  private readonly cellRefCallbacks = new Map<
    string,
    (node: HTMLDivElement | null) => void
  >();
  private readonly animatedElements = new Set<HTMLDivElement>();
  private activeControls: AnimationPlaybackControls | null = null;
  private safetyTimeoutId: number | null = null;
  private shuffleRunId = 0;
  private mediaQueryList: MediaQueryList | null = null;

  private readonly setGridRef = (node: HTMLDivElement | null): void => {
    this.gridElement = node;
  };

  private readonly handleReducedMotionChange = (
    event: MediaQueryListEvent
  ): void => {
    if (event.matches) {
      this.stopActiveShuffle();
    }
  };

  override componentDidMount(): void {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      this.mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
      this.mediaQueryList.addEventListener(
        'change',
        this.handleReducedMotionChange
      );
    }
  }

  override componentWillUnmount(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener(
        'change',
        this.handleReducedMotionChange
      );
      this.mediaQueryList = null;
    }
    this.stopActiveShuffle();
    this.cellElements.clear();
    this.cellRefCallbacks.clear();
    this.gridElement = null;
  }

  private shouldTriggerShuffle(
    prevProps: ProductGridProps,
    nextProps: ProductGridProps
  ): boolean {
    if (
      prevProps.searchQuery === undefined ||
      nextProps.searchQuery === undefined ||
      prevProps.searchQuery === nextProps.searchQuery
    ) {
      return false;
    }
    if (nextProps.products.length === 0) {
      return false;
    }
    if (isReducedMotionPreferred()) {
      return false;
    }
    return (
      getProductsKey(prevProps.products) !== getProductsKey(nextProps.products)
    );
  }

  private measureRenderedCells(
    products: readonly Product[]
  ): Map<string, CellBox> {
    const boxes = new Map<string, CellBox>();
    const gridRect = this.gridElement?.getBoundingClientRect();
    const originLeft = gridRect ? gridRect.left : 0;
    const originTop = gridRect ? gridRect.top : 0;

    for (const product of products) {
      const element = this.cellElements.get(product.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        boxes.set(product.id, {
          left: rect.left - originLeft,
          top: rect.top - originTop,
          width: rect.width,
          height: rect.height,
        });
      }
    }

    return boxes;
  }

  override getSnapshotBeforeUpdate(
    prevProps: ProductGridProps
  ): ShuffleSnapshot | null {
    if (!this.shouldTriggerShuffle(prevProps, this.props)) {
      return null;
    }

    return {
      shouldAnimate: true,
      prevBoxes: this.measureRenderedCells(prevProps.products),
    };
  }

  override componentDidUpdate(
    prevProps: ProductGridProps,
    _prevState: Record<string, never>,
    snapshot: ShuffleSnapshot | null
  ): void {
    if (!snapshot || !snapshot.shouldAnimate) {
      if (
        isReducedMotionPreferred() ||
        getProductsKey(prevProps.products) !==
          getProductsKey(this.props.products)
      ) {
        this.stopActiveShuffle();
      }
      return;
    }

    this.stopActiveShuffle();

    if (isReducedMotionPreferred() || this.props.products.length === 0) {
      return;
    }

    const nextBoxes = this.measureRenderedCells(this.props.products);

    const activeItems: ActiveCellAnimation[] = [];
    const stationarySurvivors: { element: HTMLDivElement; index: number }[] =
      [];

    this.props.products.forEach((product, index) => {
      const element = this.cellElements.get(product.id);
      const nextBox = nextBoxes.get(product.id);
      if (!element || !nextBox) return;

      const exponent = 2.4 + Math.min(index, 8) * 0.06;
      const prevBox = snapshot.prevBoxes.get(product.id);

      if (prevBox) {
        const dx = prevBox.left - nextBox.left;
        const dy = prevBox.top - nextBox.top;
        const distance = Math.hypot(dx, dy);

        if (distance >= MIN_MOVE_DISTANCE_PX) {
          const peakBlur = Math.min(4.2, Math.max(2.2, distance / 85));
          activeItems.push({
            kind: 'moving',
            element,
            dx,
            dy,
            peakBlur,
            exponent,
          });
        } else {
          stationarySurvivors.push({ element, index });
        }
      } else {
        activeItems.push({
          kind: 'entering',
          element,
          offsetY: ENTER_OFFSET_Y_PX,
          startScale: ENTER_START_SCALE,
          peakBlur: ENTER_PEAK_BLUR_PX,
          exponent,
        });
      }
    });

    if (activeItems.length === 0 && stationarySurvivors.length > 0) {
      for (const { element, index } of stationarySurvivors) {
        activeItems.push({
          kind: 'settling',
          element,
          offsetY: SETTLE_OFFSET_Y_PX,
          startScale: SETTLE_START_SCALE,
          peakBlur: SETTLE_PEAK_BLUR_PX,
          exponent: 2.4 + Math.min(index, 8) * 0.06,
        });
      }
    }

    if (activeItems.length === 0) {
      return;
    }

    for (const item of activeItems) {
      this.animatedElements.add(item.element);
    }

    this.applyAnimationFrame(activeItems, 0);

    const runId = this.shuffleRunId;
    const finishShuffle = (): void => {
      if (this.shuffleRunId !== runId) return;
      this.stopActiveShuffle();
    };

    this.safetyTimeoutId = window.setTimeout(
      finishShuffle,
      SHUFFLE_SAFETY_TIMEOUT_MS
    );

    this.activeControls = animate(0, 1, {
      duration: SHUFFLE_DURATION_SEC,
      ease: 'linear',
      onUpdate: (progress) => {
        if (this.shuffleRunId !== runId) return;
        if (isReducedMotionPreferred()) {
          this.stopActiveShuffle();
          return;
        }
        this.applyAnimationFrame(activeItems, progress);
      },
      onComplete: finishShuffle,
    });
  }

  private applyAnimationFrame(
    items: readonly ActiveCellAnimation[],
    progress: number
  ): void {
    for (const item of items) {
      if (item.element.getAttribute('data-shuffle-state') !== item.kind) {
        item.element.setAttribute('data-shuffle-state', item.kind);
      }

      const eased = computeEaseOut(progress, item.exponent);
      const remain = 1 - eased;
      const blurPx = item.peakBlur * computeBlurEnvelope(progress);

      if (item.kind === 'moving') {
        const x = item.dx * remain;
        const y = item.dy * remain;
        item.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px)`;
        item.element.style.filter =
          blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : '';
      } else {
        const y = item.offsetY * remain;
        const scale = item.startScale + (1 - item.startScale) * eased;
        item.element.style.transform = `translate3d(0px, ${y.toFixed(2)}px, 0px) scale(${scale.toFixed(4)})`;
        item.element.style.filter =
          blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : '';
        if (item.kind === 'entering') {
          const opacity = 0.18 + 0.82 * eased;
          item.element.style.opacity = opacity.toFixed(3);
        }
      }
    }
  }

  private clearElementStyles(element: HTMLDivElement): void {
    element.style.transform = '';
    element.style.filter = '';
    element.style.opacity = '';
    element.removeAttribute('data-shuffle-state');
  }

  private stopActiveShuffle(): void {
    this.shuffleRunId += 1;
    if (this.safetyTimeoutId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }
    if (this.activeControls !== null) {
      this.activeControls.stop();
      this.activeControls = null;
    }
    for (const element of this.animatedElements) {
      this.clearElementStyles(element);
    }
    this.animatedElements.clear();
    for (const element of this.cellElements.values()) {
      this.clearElementStyles(element);
    }
  }

  private getCellRef(
    productId: string
  ): (node: HTMLDivElement | null) => void {
    let callback = this.cellRefCallbacks.get(productId);
    if (!callback) {
      callback = (node: HTMLDivElement | null) => {
        if (node) {
          this.cellElements.set(productId, node);
        } else {
          this.cellElements.delete(productId);
        }
      };
      this.cellRefCallbacks.set(productId, callback);
    }
    return callback;
  }

  override render(): ReactNode {
    const {
      products,
      headingAs = 'h3',
      emptyMessage = 'Hiện chưa có sản phẩm nào trong danh mục này.',
      onResetFilter,
      resetLabel = 'Xem tất cả sản phẩm',
    } = this.props;

    if (products.length === 0) {
      return (
        <div className={styles.emptyContainer} role="status">
          <p className={styles.emptyText}>{emptyMessage}</p>
          {onResetFilter && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onResetFilter}
            >
              {resetLabel}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div ref={this.setGridRef} className={styles.grid}>
        {products.map((product) => (
          <div
            key={product.id}
            ref={this.getCellRef(product.id)}
            className={styles.cell}
          >
            <ProductCard product={product} headingAs={headingAs} />
          </div>
        ))}
      </div>
    );
  }
}
