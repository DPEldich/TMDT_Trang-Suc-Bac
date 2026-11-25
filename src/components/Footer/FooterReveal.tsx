'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { scroll } from 'motion/react';
import styles from './Footer.module.css';

export type FooterRevealProps = Omit<ComponentPropsWithoutRef<'footer'>, 'style'>;

const REVEAL_OPACITY_MIN = 0.3;
const REVEAL_SCALE_MIN = 0.985;
const HEADER_HEIGHT_REM = 3.5;
const DEFAULT_HEADER_HEIGHT_PX = 56;
const FIT_EPSILON_PX = 1;
const PROGRESS_EDGE_EPSILON = 0.001;
const MIN_SCROLLABLE_RANGE_PX = 1;
const HIDDEN_FOOTER_PATHNAMES = new Set(['/san-pham', '/ve-chung-toi', '/gio-hang']);

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

function measureHeaderHeight(): number {
  const header = document.querySelector('header');
  if (header) {
    const height = header.getBoundingClientRect().height;
    if (Number.isFinite(height) && height > 0) {
      return height;
    }
  }
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  if (Number.isFinite(rootFontSize) && rootFontSize > 0) {
    return rootFontSize * HEADER_HEIGHT_REM;
  }
  return DEFAULT_HEADER_HEIGHT_PX;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 1;
  if (value <= PROGRESS_EDGE_EPSILON) return 0;
  if (value >= 1 - PROGRESS_EDGE_EPSILON) return 1;
  return value;
}

function readCurrentProgress(footer: HTMLElement): number {
  const viewportHeight =
    document.documentElement.clientHeight || window.innerHeight;
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - viewportHeight
  );
  if (maxScroll <= MIN_SCROLLABLE_RANGE_PX) {
    return 1;
  }
  const rect = footer.getBoundingClientRect();
  if (!Number.isFinite(rect.height) || rect.height <= 0) {
    return 1;
  }
  return clampProgress((viewportHeight - rect.top) / rect.height);
}

function applyRevealVars(
  footer: HTMLElement,
  progress: number,
  revealHeight: number
): void {
  const normalized = clampProgress(progress);
  const remaining = 1 - normalized;
  const offsetY = remaining === 0 ? 0 : -(remaining * revealHeight);
  const opacity =
    REVEAL_OPACITY_MIN + (1 - REVEAL_OPACITY_MIN) * normalized;
  const scale = REVEAL_SCALE_MIN + (1 - REVEAL_SCALE_MIN) * normalized;

  footer.style.setProperty(
    '--footer-reveal-y',
    offsetY === 0 ? '0px' : `${offsetY.toFixed(2)}px`
  );
  footer.style.setProperty(
    '--footer-reveal-opacity',
    normalized === 1 ? '1' : opacity.toFixed(3)
  );
  footer.style.setProperty(
    '--footer-reveal-scale',
    normalized === 1 ? '1' : scale.toFixed(4)
  );
}

function clearRevealVars(footer: HTMLElement): void {
  footer.style.removeProperty('--footer-reveal-y');
  footer.style.removeProperty('--footer-reveal-opacity');
  footer.style.removeProperty('--footer-reveal-scale');
}

export function FooterReveal({
  children,
  className,
  ...rest
}: FooterRevealProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useLiveReducedMotion();
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    let cancelled = false;
    let rafId: number | null = null;
    let stopScroll: (() => void) | null = null;

    const detachScroll = () => {
      stopScroll?.();
      stopScroll = null;
    };

    const sync = () => {
      if (cancelled) return;

      if (prefersReducedMotion) {
        detachScroll();
        clearRevealVars(footer);
        footer.dataset.state = 'reduced-motion';
        return;
      }

      const viewportHeight =
        document.documentElement.clientHeight || window.innerHeight;
      const headerHeight = measureHeaderHeight();
      const availableHeight = viewportHeight - headerHeight;
      const footerHeight = footer.offsetHeight;
      const revealHeight = footer.clientHeight;
      const fitsViewport =
        footerHeight > 0 &&
        revealHeight > 0 &&
        availableHeight > 0 &&
        footerHeight <= availableHeight + FIT_EPSILON_PX;

      if (!fitsViewport) {
        detachScroll();
        clearRevealVars(footer);
        footer.dataset.state = 'native';
        return;
      }

      applyRevealVars(footer, readCurrentProgress(footer), revealHeight);
      footer.dataset.state = 'active';

      if (!stopScroll) {
        stopScroll = scroll(
          (progress, info) => {
            if (cancelled) return;
            const effectiveProgress =
              info.y.scrollLength <= MIN_SCROLLABLE_RANGE_PX ? 1 : progress;
            const measuredHeight =
              info.y.targetLength > 0 ? info.y.targetLength : footer.clientHeight;
            applyRevealVars(footer, effectiveProgress, measuredHeight);
          },
          {
            target: footer,
            offset: ['start end', 'end end'],
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
      resizeObserver.observe(footer);
      if (document.body) {
        resizeObserver.observe(document.body);
      }
    }

    window.addEventListener('resize', scheduleSync, { passive: true });
    if (document.fonts?.ready) {
      void document.fonts.ready.then(scheduleSync);
    }

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      detachScroll();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleSync);
      clearRevealVars(footer);
      delete footer.dataset.state;
    };
  }, [prefersReducedMotion, pathname]);

  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (HIDDEN_FOOTER_PATHNAMES.has(normalizedPathname)) {
    return null;
  }

  return (
    <footer
      ref={footerRef}
      className={clsx(styles.footer, className)}
      {...rest}
    >
      <div className={styles.revealContent}>{children}</div>
    </footer>
  );
}
