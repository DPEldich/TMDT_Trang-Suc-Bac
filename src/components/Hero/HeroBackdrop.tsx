'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from 'react';
import clsx from 'clsx';
import { scroll } from 'motion/react';
import styles from './Hero.module.css';

export type HeroBackdropProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'style'
>;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const PROGRESS_EDGE_EPSILON = 0.001;
const MIN_SCROLLABLE_RANGE_PX = 1;
const FADE_CURVE_EXPONENT = 1.5;

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => {};
  }
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  }
  mediaQuery.addListener(onStoreChange);
  return () => mediaQuery.removeListener(onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function useLiveReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value <= PROGRESS_EDGE_EPSILON) return 0;
  if (value >= 1 - PROGRESS_EDGE_EPSILON) return 1;
  return value;
}

function readHeroScrollProgress(hero: HTMLElement): number {
  const viewportHeight =
    document.documentElement.clientHeight || window.innerHeight;
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - viewportHeight
  );
  if (maxScroll <= MIN_SCROLLABLE_RANGE_PX) {
    return 0;
  }
  const rect = hero.getBoundingClientRect();
  if (!Number.isFinite(rect.height) || rect.height <= 0) {
    return 0;
  }
  return clampProgress(-rect.top / rect.height);
}

function clearBackdropVars(backdrop: HTMLElement): void {
  backdrop.style.removeProperty('--hero-zoom-scale-progress');
  backdrop.style.removeProperty('--hero-zoom-blur-progress');
  backdrop.style.removeProperty('--hero-zoom-fade-progress');
}

function applyBackdropVars(backdrop: HTMLElement, progress: number): void {
  const normalized = clampProgress(progress);
  if (normalized === 0) {
    clearBackdropVars(backdrop);
    return;
  }

  const fadeProgress =
    normalized === 1 ? 1 : Math.pow(normalized, FADE_CURVE_EXPONENT);

  backdrop.style.setProperty(
    '--hero-zoom-scale-progress',
    normalized === 1 ? '1' : normalized.toFixed(4)
  );
  backdrop.style.setProperty(
    '--hero-zoom-blur-progress',
    normalized === 1 ? '1' : normalized.toFixed(4)
  );
  backdrop.style.setProperty(
    '--hero-zoom-fade-progress',
    fadeProgress === 1 ? '1' : fadeProgress.toFixed(4)
  );
}

export function HeroBackdrop({ className, ...rest }: HeroBackdropProps) {
  const prefersReducedMotion = useLiveReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const target = backdrop.closest('section') ?? backdrop.parentElement;
    if (!target) return;

    let cancelled = false;
    let rafId: number | null = null;
    let stopScroll: (() => void) | null = null;
    let lastProgress = -1;

    const detachScroll = () => {
      stopScroll?.();
      stopScroll = null;
    };

    const writeProgress = (rawProgress: number) => {
      const normalized = clampProgress(rawProgress);
      if (normalized === lastProgress) return;
      lastProgress = normalized;
      applyBackdropVars(backdrop, normalized);
    };

    const sync = () => {
      if (cancelled) return;

      if (prefersReducedMotion) {
        detachScroll();
        lastProgress = -1;
        clearBackdropVars(backdrop);
        backdrop.dataset.state = 'reduced-motion';
        return;
      }

      backdrop.dataset.state = 'active';
      writeProgress(readHeroScrollProgress(target));

      if (!stopScroll) {
        stopScroll = scroll(
          (progress, info) => {
            if (cancelled) return;
            const effectiveProgress =
              info.y.scrollLength <= MIN_SCROLLABLE_RANGE_PX ? 0 : progress;
            writeProgress(effectiveProgress);
          },
          {
            target,
            offset: ['start start', 'end start'],
          }
        );
      }
    };

    const scheduleSync = () => {
      if (cancelled || rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        sync();
      });
    };

    sync();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleSync);
      resizeObserver.observe(target);
    }

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('pageshow', scheduleSync);

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      detachScroll();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('pageshow', scheduleSync);
      clearBackdropVars(backdrop);
      delete backdrop.dataset.state;
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={backdropRef}
      className={clsx(styles.backdrop, className)}
      aria-hidden="true"
      data-hero-backdrop="true"
      {...rest}
    />
  );
}
