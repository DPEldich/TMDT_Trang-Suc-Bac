import type { Product } from '../../types/product';

export type CoverflowSlot =
  | 'far-prev'
  | 'prev'
  | 'center'
  | 'next'
  | 'far-next';

export type CoverflowLayer = 'front' | 'side' | 'back';

export interface CoverflowMetrics {
  stepX: number;
  farStepX: number;
  sideRotateY: number;
  farRotateY: number;
  sideScale: number;
  farScale: number;
  sideOpacity: number;
}

export interface SlidePose {
  x: number;
  rotateY: number;
  scale: number;
  opacity: number;
  layer: CoverflowLayer;
}

export interface ResolveSnapIndexParams {
  activeIndex: number;
  count: number;
  deltaX: number;
  velocityX: number;
  stepX: number;
}

export interface ResolveKeyboardIndexParams {
  key: string;
  activeIndex: number;
  count: number;
}

export const COVERFLOW_AXIS_LOCK_PX = 8;
export const COVERFLOW_FLICK_VELOCITY_PX = 360;
export const COVERFLOW_FLICK_MIN_DELTA_PX = 18;
export const COVERFLOW_SNAP_THRESHOLD_RATIO = 0.22;
export const COVERFLOW_BOUNDARY_RESISTANCE = 0.28;
export const COVERFLOW_SPRING_DURATION_SEC = 0.52;
export const COVERFLOW_SPRING_BOUNCE = 0.06;

/**
 * Safe non-DOM fallback only used when CSS tokens cannot be measured.
 * Runtime visual geometry always comes from resolved CSS tokens in tokens.css
 * and FeaturedProducts.module.css.
 */
export const FALLBACK_COVERFLOW_METRICS: Readonly<CoverflowMetrics> = {
  stepX: 272,
  farStepX: 436,
  sideRotateY: 26,
  farRotateY: 36,
  sideScale: 0.82,
  farScale: 0.68,
  sideOpacity: 0.78,
};

export function parseCssAngleDeg(raw: string, fallback: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value)) return fallback;

  if (trimmed.endsWith('grad')) {
    return value * 0.9;
  }
  if (trimmed.endsWith('rad')) {
    return (value * 180) / Math.PI;
  }
  if (trimmed.endsWith('turn')) {
    return value * 360;
  }
  return value;
}

export function parseCssPositiveNumber(raw: string, fallback: number): number {
  const value = Number.parseFloat(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

export function parseCssUnitInterval(raw: string, fallback: number): number {
  const value = Number.parseFloat(raw.trim());
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return fallback;
  }
  return value;
}

export function clampCoverflowIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/**
 * Deterministic initial spotlight index.
 * Starts centered on the second card when 3+ items exist so desktop immediately
 * frames 3 visible cards and mobile shows balanced left/right peeks.
 */
export function getInitialCoverflowIndex(count: number): number {
  if (count <= 2) {
    return 0;
  }
  return Math.floor((count - 1) / 2);
}

export function getCoverflowSlot(
  index: number,
  activeIndex: number
): CoverflowSlot {
  const offset = index - activeIndex;
  if (offset === 0) return 'center';
  if (offset === -1) return 'prev';
  if (offset === 1) return 'next';
  if (offset < -1) return 'far-prev';
  return 'far-next';
}

export function applyBoundaryResistance(
  virtualIndex: number,
  count: number
): number {
  if (count <= 1) {
    return 0;
  }

  const maxIndex = count - 1;
  if (virtualIndex < 0) {
    return virtualIndex * COVERFLOW_BOUNDARY_RESISTANCE;
  }
  if (virtualIndex > maxIndex) {
    return maxIndex + (virtualIndex - maxIndex) * COVERFLOW_BOUNDARY_RESISTANCE;
  }
  return virtualIndex;
}

export function getSlideLayer(offset: number): CoverflowLayer {
  const distance = Math.abs(offset);
  if (distance < 0.5) return 'front';
  if (distance < 1.5) return 'side';
  return 'back';
}

export function getSlidePose(
  offset: number,
  metrics: CoverflowMetrics,
  reducedMotion: boolean
): SlidePose {
  const abs = Math.abs(offset);
  const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;
  const layer = getSlideLayer(offset);

  if (abs <= 1) {
    const x = offset === 0 ? 0 : offset * metrics.stepX;
    const rotateY =
      reducedMotion || offset === 0 ? 0 : -offset * metrics.sideRotateY;
    const scale = 1 - abs * (1 - metrics.sideScale);
    const opacity = 1 - abs * (1 - metrics.sideOpacity);
    return { x, rotateY, scale, opacity, layer };
  }

  if (abs <= 2) {
    const t = abs - 1;
    const x = sign * (metrics.stepX + t * (metrics.farStepX - metrics.stepX));
    const rotateY = reducedMotion
      ? 0
      : -sign *
        (metrics.sideRotateY + t * (metrics.farRotateY - metrics.sideRotateY));
    const scale = metrics.sideScale - t * (metrics.sideScale - metrics.farScale);
    const opacity = metrics.sideOpacity * (1 - t);
    return { x, rotateY, scale, opacity, layer };
  }

  return {
    x: sign * metrics.farStepX,
    rotateY: reducedMotion ? 0 : -sign * metrics.farRotateY,
    scale: metrics.farScale,
    opacity: 0,
    layer: 'back',
  };
}

export function resolveSnapIndex({
  activeIndex,
  count,
  deltaX,
  velocityX,
  stepX,
}: ResolveSnapIndexParams): number {
  if (count <= 1) {
    return 0;
  }

  const safeStep = Math.max(1, stepX);
  const rawShift = -deltaX / safeStep;
  const isFlick =
    Math.abs(velocityX) >= COVERFLOW_FLICK_VELOCITY_PX &&
    Math.abs(deltaX) >= COVERFLOW_FLICK_MIN_DELTA_PX;
  const pastThreshold = Math.abs(rawShift) >= COVERFLOW_SNAP_THRESHOLD_RATIO;

  if (!isFlick && !pastThreshold) {
    return clampCoverflowIndex(activeIndex, count);
  }

  const direction = deltaX < 0 ? 1 : -1;
  const roundedShift = Math.round(rawShift);
  const stepShift =
    Math.abs(roundedShift) >= 1 && Math.sign(roundedShift) === direction
      ? roundedShift
      : direction;

  return clampCoverflowIndex(activeIndex + stepShift, count);
}

export function resolveKeyboardIndex({
  key,
  activeIndex,
  count,
}: ResolveKeyboardIndexParams): number | null {
  if (count <= 0) {
    return null;
  }

  switch (key) {
    case 'ArrowLeft':
      return clampCoverflowIndex(activeIndex - 1, count);
    case 'ArrowRight':
      return clampCoverflowIndex(activeIndex + 1, count);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

export function formatSelectionAnnouncement(
  product: Pick<Product, 'name' | 'price' | 'stock'>,
  index: number,
  count: number,
  formattedPrice: string
): string {
  const stockLabel =
    product.stock > 0
      ? `còn ${product.stock} sản phẩm`
      : 'tạm hết hàng';
  return `Mẫu ${index + 1} trên ${count}: ${product.name}, ${formattedPrice}, ${stockLabel}.`;
}
