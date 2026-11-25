export type HeaderSurfaceMode = 'transparent' | 'solid';

export const HERO_SURFACE_ANCHOR_SELECTOR = '[data-hero-surface-anchor="true"]';

export function isHomePathname(pathname: string | null | undefined): boolean {
  return pathname === '/';
}

/**
 * Computes the header lower edge in viewport pixels for IntersectionObserver rootMargin.
 */
export function resolveHeaderInsetTop(headerBottom: number): number {
  if (!Number.isFinite(headerBottom) || headerBottom <= 0) {
    return 1;
  }
  return Math.max(1, Math.round(headerBottom));
}

/**
 * Formats an IntersectionObserver rootMargin that aligns the top of the root
 * intersection rectangle with the measured lower edge of the fixed header.
 */
export function buildHeaderIntersectionRootMargin(headerBottom: number): string {
  const insetTop = resolveHeaderInsetTop(headerBottom);
  return `-${insetTop}px 0px 0px 0px`;
}

/**
 * Returns true once the hero bottom has passed (or reached) the header's lower edge.
 */
export function shouldHeaderSurface(
  heroBottom: number,
  headerBottom: number
): boolean {
  if (!Number.isFinite(heroBottom) || !Number.isFinite(headerBottom)) {
    return true;
  }
  return heroBottom <= resolveHeaderInsetTop(headerBottom);
}

/**
 * Resolves the active surface mode for a route and observed boundary state.
 */
export function resolveHeaderSurfaceMode(params: {
  isHome: boolean;
  isPastHero: boolean;
}): HeaderSurfaceMode {
  if (!params.isHome) {
    return 'solid';
  }
  return params.isPastHero ? 'solid' : 'transparent';
}
