import type { CustomerFeedback } from '../../types/feedback';

export const MIN_TICKER_REVIEWS = 5;
export const MAX_TICKER_GROUPS = 4;

export type TickerDirection = 'up' | 'down';
export type TickerColumnCount = 1 | 2 | 3 | 5;

export interface TickerLaneItem {
  readonly feedback: CustomerFeedback;
  readonly isCanonical: boolean;
  readonly key: string;
}

export interface TickerLanePlan {
  readonly laneIndex: number;
  readonly direction: TickerDirection;
  readonly speedPxPerSec: number;
  readonly initialPhase: number;
  readonly items: readonly TickerLaneItem[];
}

export const FEEDBACK_BREAKPOINT_2COL = '(min-width: 24rem)';
export const FEEDBACK_BREAKPOINT_3COL = '(min-width: 48rem)';
export const FEEDBACK_BREAKPOINT_5COL = '(min-width: 64rem)';

const LANE_SPEEDS_PX_PER_SEC: readonly number[] = [18, 21, 17, 22, 19];
const LANE_INITIAL_PHASES: readonly number[] = [0.04, 0.37, 0.62, 0.19, 0.48];
const MIN_DISJOINT_REVIEWS_PER_LANE = 3;

export function resolveTickerColumnCount(widthPx: number): TickerColumnCount {
  if (widthPx >= 1024) return 5;
  if (widthPx >= 768) return 3;
  if (widthPx >= 384) return 2;
  return 1;
}

export function computeRequiredGroupCount(
  viewportHeightPx: number,
  cycleHeightPx: number
): number {
  if (
    !Number.isFinite(viewportHeightPx) ||
    !Number.isFinite(cycleHeightPx) ||
    viewportHeightPx <= 0 ||
    cycleHeightPx <= 0
  ) {
    return 2;
  }
  const needed = Math.ceil(viewportHeightPx / cycleHeightPx) + 1;
  return Math.min(MAX_TICKER_GROUPS, Math.max(2, needed));
}

export function normalizeProgress(
  timeSeconds: number,
  durationSeconds: number
): number {
  if (
    !Number.isFinite(timeSeconds) ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return 0;
  }
  const wrapped = ((timeSeconds % durationSeconds) + durationSeconds) % durationSeconds;
  return wrapped / durationSeconds;
}

function estimateReviewWeight(feedback: CustomerFeedback): number {
  const newlineCount = feedback.content.split('\n').length - 1;
  return 180 + feedback.content.length + newlineCount * 40;
}

function resolveSharedPoolStartOffset(
  laneIndex: number,
  totalReviews: number
): number {
  const raw = laneIndex * 2;
  if (totalReviews % 2 === 0 && raw >= totalReviews) {
    return (raw + 1) % totalReviews;
  }
  return raw % totalReviews;
}

function buildDisjointLaneBuckets(
  feedbacks: readonly CustomerFeedback[],
  columnCount: TickerColumnCount
): CustomerFeedback[][] {
  if (columnCount === 1) {
    return [Array.from(feedbacks)];
  }

  const buckets: CustomerFeedback[][] = Array.from(
    { length: columnCount },
    () => []
  );
  const weights: number[] = Array.from({ length: columnCount }, () => 0);
  const maxPerLane = Math.ceil(feedbacks.length / columnCount);

  for (const feedback of feedbacks) {
    let targetLane = 0;
    let bestWeight = Number.POSITIVE_INFINITY;

    for (let lane = 0; lane < columnCount; lane += 1) {
      if (buckets[lane].length >= maxPerLane) {
        continue;
      }
      if (weights[lane] < bestWeight) {
        bestWeight = weights[lane];
        targetLane = lane;
      }
    }

    buckets[targetLane].push(feedback);
    weights[targetLane] += estimateReviewWeight(feedback);
  }

  return buckets;
}

function buildSharedPoolLaneBuckets(
  feedbacks: readonly CustomerFeedback[],
  columnCount: TickerColumnCount
): CustomerFeedback[][] {
  const total = feedbacks.length;
  const buckets: CustomerFeedback[][] = [];

  for (let lane = 0; lane < columnCount; lane += 1) {
    const startOffset = resolveSharedPoolStartOffset(lane, total);
    const laneReviews: CustomerFeedback[] = [];

    for (let step = 0; step < total; step += 1) {
      const review = feedbacks[(startOffset + step) % total];
      if (review) {
        laneReviews.push(review);
      }
    }

    buckets.push(laneReviews);
  }

  return buckets;
}

export function buildTickerLanes(
  feedbacks: readonly CustomerFeedback[],
  columnCount: TickerColumnCount
): readonly TickerLanePlan[] {
  if (feedbacks.length < MIN_TICKER_REVIEWS) {
    return [];
  }

  const useDisjointMode =
    columnCount === 1 ||
    feedbacks.length >= columnCount * MIN_DISJOINT_REVIEWS_PER_LANE;

  const rawBuckets = useDisjointMode
    ? buildDisjointLaneBuckets(feedbacks, columnCount)
    : buildSharedPoolLaneBuckets(feedbacks, columnCount);

  const canonicalSlotById = new Map<string, string>();
  const maxLaneLength = rawBuckets.reduce(
    (maxLen, bucket) => Math.max(maxLen, bucket.length),
    0
  );

  for (let itemIndex = 0; itemIndex < maxLaneLength; itemIndex += 1) {
    for (let laneIndex = 0; laneIndex < rawBuckets.length; laneIndex += 1) {
      const review = rawBuckets[laneIndex]?.[itemIndex];
      if (!review || canonicalSlotById.has(review.id)) {
        continue;
      }
      canonicalSlotById.set(review.id, `${laneIndex}:${itemIndex}`);
    }
  }

  return rawBuckets.map((bucket, laneIndex) => {
    const direction: TickerDirection = laneIndex % 2 === 0 ? 'up' : 'down';
    const speedPxPerSec =
      LANE_SPEEDS_PX_PER_SEC[laneIndex % LANE_SPEEDS_PX_PER_SEC.length] ?? 19;
    const initialPhase =
      LANE_INITIAL_PHASES[laneIndex % LANE_INITIAL_PHASES.length] ?? 0;

    const items: TickerLaneItem[] = bucket.map((feedback, itemIndex) => {
      const slotKey = `${laneIndex}:${itemIndex}`;
      const isCanonical = canonicalSlotById.get(feedback.id) === slotKey;
      return {
        feedback,
        isCanonical,
        key: `${laneIndex}-${itemIndex}-${feedback.id}`,
      };
    });

    return {
      laneIndex,
      direction,
      speedPxPerSec,
      initialPhase,
      items,
    };
  });
}
