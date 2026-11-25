'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  buildHeaderIntersectionRootMargin,
  HERO_SURFACE_ANCHOR_SELECTOR,
  isHomePathname,
  resolveHeaderInsetTop,
  resolveHeaderSurfaceMode,
  shouldHeaderSurface,
} from './headerSurfaceGeometry';

export interface HeaderSurfaceProps extends ComponentPropsWithoutRef<'header'> {
  children: ReactNode;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function HeaderSurface({ children, ...rest }: HeaderSurfaceProps) {
  const pathname = usePathname();
  const isHome = isHomePathname(pathname);
  const headerRef = useRef<HTMLElement>(null);

  const [surfaceState, setSurfaceState] = useState<{
    routeKey: string;
    isPastHero: boolean;
  }>({
    routeKey: pathname,
    isPastHero: !isHome,
  });

  if (surfaceState.routeKey !== pathname) {
    setSurfaceState({
      routeKey: pathname,
      isPastHero: !isHome,
    });
  }

  const surfaceMode = resolveHeaderSurfaceMode({
    isHome,
    isPastHero: surfaceState.routeKey === pathname ? surfaceState.isPastHero : !isHome,
  });

  useIsomorphicLayoutEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    if (!isHome) {
      headerEl.dataset.surface = 'solid';
      delete headerEl.dataset.transitionReady;
      return;
    }

    let cancelled = false;
    let intersectionObserver: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let currentHero: HTMLElement | null = null;
    let currentInsetTop = -1;
    let readyFrameId: number | null = null;

    delete headerEl.dataset.transitionReady;

    const applyMeasuredSurface = (nextPastHero: boolean, syncReactState: boolean) => {
      if (cancelled) return;
      headerEl.dataset.surface = nextPastHero ? 'solid' : 'transparent';
      if (syncReactState) {
        setSurfaceState((prev) => {
          if (prev.routeKey === pathname && prev.isPastHero === nextPastHero) {
            return prev;
          }
          return { routeKey: pathname, isPastHero: nextPastHero };
        });
      }
    };

    const measureNow = (syncReactState: boolean) => {
      if (cancelled) return;
      const heroEl =
        currentHero && currentHero.isConnected
          ? currentHero
          : document.querySelector<HTMLElement>(HERO_SURFACE_ANCHOR_SELECTOR);
      if (!heroEl) return;

      const headerBottom = headerEl.getBoundingClientRect().bottom;
      const heroBottom = heroEl.getBoundingClientRect().bottom;
      applyMeasuredSurface(shouldHeaderSurface(heroBottom, headerBottom), syncReactState);
    };

    const rebuildIntersectionObserver = (heroEl: HTMLElement) => {
      const headerBottom = headerEl.getBoundingClientRect().bottom;
      const insetTop = resolveHeaderInsetTop(headerBottom);

      if (intersectionObserver && currentHero === heroEl && currentInsetTop === insetTop) {
        return;
      }

      intersectionObserver?.disconnect();
      currentInsetTop = insetTop;

      if (typeof IntersectionObserver === 'undefined') {
        measureNow(true);
        return;
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          const pastHero =
            !entry.isIntersecting ||
            shouldHeaderSurface(entry.boundingClientRect.bottom, insetTop);
          applyMeasuredSurface(pastHero, true);
        },
        {
          root: null,
          rootMargin: buildHeaderIntersectionRootMargin(insetTop),
          threshold: 0,
        }
      );

      intersectionObserver.observe(heroEl);
    };

    const attachToHero = (heroEl: HTMLElement) => {
      if (cancelled) return;
      currentHero = heroEl;

      // Synchronous pre-paint surface sync prevents flashes on deep-scroll loads & route restore
      measureNow(false);
      rebuildIntersectionObserver(heroEl);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(() => {
          if (cancelled || !heroEl.isConnected) return;
          rebuildIntersectionObserver(heroEl);
          measureNow(true);
        });
        resizeObserver.observe(headerEl);
        resizeObserver.observe(heroEl);
      }

      if (readyFrameId !== null) {
        cancelAnimationFrame(readyFrameId);
      }
      readyFrameId = requestAnimationFrame(() => {
        readyFrameId = null;
        if (cancelled) return;
        measureNow(true);
        headerEl.dataset.transitionReady = 'true';
      });
    };

    const initialHero = document.querySelector<HTMLElement>(HERO_SURFACE_ANCHOR_SELECTOR);
    if (initialHero) {
      attachToHero(initialHero);
    } else if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        const foundHero = document.querySelector<HTMLElement>(HERO_SURFACE_ANCHOR_SELECTOR);
        if (foundHero) {
          mutationObserver?.disconnect();
          mutationObserver = null;
          attachToHero(foundHero);
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    const handleViewportResync = () => {
      if (cancelled) return;
      const heroEl =
        currentHero && currentHero.isConnected
          ? currentHero
          : document.querySelector<HTMLElement>(HERO_SURFACE_ANCHOR_SELECTOR);
      if (!heroEl) return;
      rebuildIntersectionObserver(heroEl);
      measureNow(true);
    };

    window.addEventListener('resize', handleViewportResync);
    window.addEventListener('pageshow', handleViewportResync);
    window.addEventListener('hashchange', handleViewportResync);

    return () => {
      cancelled = true;
      if (readyFrameId !== null) {
        cancelAnimationFrame(readyFrameId);
      }
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', handleViewportResync);
      window.removeEventListener('pageshow', handleViewportResync);
      window.removeEventListener('hashchange', handleViewportResync);
    };
  }, [isHome, pathname]);

  return (
    <header
      ref={headerRef}
      data-overlay={isHome ? 'true' : 'false'}
      data-surface={surfaceMode}
      {...rest}
    >
      {children}
    </header>
  );
}
