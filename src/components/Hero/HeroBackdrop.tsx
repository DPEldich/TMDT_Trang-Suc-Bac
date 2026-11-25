'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from 'react';
import clsx from 'clsx';
import heroBackdropAsset from '../../../asset/Background.png';
import {
  createHeroBackdropRenderer,
  resolveBackdropPlaybackState,
  type HeroBackdropRendererHandle,
  type HeroBackdropRendererStatus,
} from './heroBackdropRenderer';
import styles from './Hero.module.css';

export type HeroBackdropProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'style'
>;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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

function getServerFalseSnapshot(): boolean {
  return false;
}

function subscribeDocumentVisibility(onStoreChange: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('visibilitychange', onStoreChange);
  return () => {
    document.removeEventListener('visibilitychange', onStoreChange);
  };
}

function getDocumentVisibleSnapshot(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

function getServerTrueSnapshot(): boolean {
  return true;
}

function measureElementBox(element: HTMLElement): {
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || element.clientWidth,
    height: rect.height || element.clientHeight,
  };
}

export function HeroBackdrop({ className, ...rest }: HeroBackdropProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerFalseSnapshot
  );
  const isDocumentVisible = useSyncExternalStore(
    subscribeDocumentVisibility,
    getDocumentVisibleSnapshot,
    getServerTrueSnapshot
  );

  const [rendererStatus, setRendererStatus] =
    useState<HeroBackdropRendererStatus>('loading');
  const [isInView, setIsInView] = useState<boolean>(true);

  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<HeroBackdropRendererHandle | null>(null);

  const playback = resolveBackdropPlaybackState({
    prefersReducedMotion,
    rendererStatus,
    isInView,
    isDocumentVisible,
  });

  // Observe whether the hero section intersects the viewport to pause offscreen work
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const target = backdrop.closest('section') ?? backdrop;
    const observer = new IntersectionObserver(
      (entries) => {
        const latest = entries[entries.length - 1];
        if (!latest) return;
        setIsInView(latest.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Initialize native WebGL fluid backdrop renderer on demand (skipped when reduced-motion is active)
  useEffect(() => {
    if (prefersReducedMotion || getReducedMotionSnapshot()) {
      return;
    }

    const backdrop = backdropRef.current;
    const canvas = canvasRef.current;
    if (!backdrop || !canvas) {
      return;
    }

    const renderer = createHeroBackdropRenderer({
      canvas,
      imageSrc: heroBackdropAsset.src,
      fallbackWidth: heroBackdropAsset.width,
      fallbackHeight: heroBackdropAsset.height,
      onStatusChange: (nextStatus) => {
        setRendererStatus(nextStatus);
      },
    });
    rendererRef.current = renderer;

    const syncSize = () => {
      const { width, height } = measureElementBox(backdrop);
      renderer.resize(width, height, window.devicePixelRatio || 1);
    };

    syncSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(backdrop);
    }

    window.addEventListener('resize', syncSize, { passive: true });
    window.addEventListener('pageshow', syncSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('pageshow', syncSize);
      renderer.dispose();
      if (rendererRef.current === renderer) {
        rendererRef.current = null;
      }
      setRendererStatus('loading');
    };
  }, [prefersReducedMotion]);

  // Start or pause frame loop cleanly whenever playback conditions change
  useEffect(() => {
    rendererRef.current?.setAnimating(playback.shouldAnimate);
  }, [playback.shouldAnimate]);

  return (
    <div
      ref={backdropRef}
      className={clsx(styles.backdrop, className)}
      aria-hidden="true"
      data-hero-backdrop="true"
      data-state={playback.dataState}
      {...rest}
    >
      <div className={styles.backdropStatic} />
      <canvas
        ref={canvasRef}
        className={styles.backdropCanvas}
        data-visible={playback.canvasVisible ? 'true' : 'false'}
      />
    </div>
  );
}
