'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { animate, type AnimationPlaybackControls } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import styles from './NavigationCurtain.module.css';

type CurtainPhase = 'idle' | 'covering' | 'waiting' | 'revealing';
type Navigate = (href: string, scroll?: boolean) => boolean;

const CurtainNavigation = createContext<Navigate | null>(null);
const closedLeft = 'polygon(0% 0%, 0% 0%, -16% 100%, 0% 100%)';
const covered = 'polygon(0% 0%, 116% 0%, 100% 100%, 0% 100%)';
const closedRight = 'polygon(116% 0%, 116% 0%, 100% 100%, 100% 100%)';

export function NavigationCurtain({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null);
  const phase = useRef<CurtainPhase>('idle');
  const fromPath = useRef('');
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const revealTimeout = useRef<number | undefined>(undefined);

  const reveal = useCallback(() => {
    const element = layer.current;
    if (!element || phase.current !== 'waiting') return;

    window.clearTimeout(revealTimeout.current);
    phase.current = 'revealing';
    animation.current = animate(element, { clipPath: [covered, closedRight] }, {
      duration: 0.32,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        phase.current = 'idle';
        element.removeAttribute('data-navigation-curtain-active');
      },
    });
  }, []);

  useEffect(() => {
    if (pathname !== fromPath.current) reveal();
  }, [pathname, reveal]);

  useEffect(() => () => {
    window.clearTimeout(revealTimeout.current);
    animation.current?.stop();
  }, []);

  const navigate = useCallback<Navigate>((href, scroll) => {
    const element = layer.current;
    const destination = new URL(href, window.location.href);
    const current = window.location;
    if (
      !element ||
      destination.origin !== current.origin ||
      destination.pathname === current.pathname ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    if (phase.current !== 'idle') return true;

    fromPath.current = current.pathname;
    phase.current = 'covering';
    element.setAttribute('data-navigation-curtain-active', '');
    animation.current = animate(element, { clipPath: [closedLeft, covered] }, {
      duration: 0.23,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        phase.current = 'waiting';
        if (window.location.pathname !== fromPath.current) {
          reveal();
          return;
        }
        // Release the curtain if the route stalls or the navigation is cancelled.
        revealTimeout.current = window.setTimeout(reveal, 1800);
        router.push(href, { scroll });
      },
    });
    return true;
  }, [reveal, router]);

  return (
    <CurtainNavigation.Provider value={navigate}>
      {children}
      <div ref={layer} className={styles.curtain} aria-hidden="true" />
    </CurtainNavigation.Provider>
  );
}

type CurtainLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate' | 'replace' | 'as'> & {
  href: string;
};

export function CurtainLink({ href, scroll, ...props }: CurtainLinkProps) {
  const navigate = useContext(CurtainNavigation);

  return (
    <Link
      {...props}
      href={href}
      scroll={scroll}
      onNavigate={(event) => {
        if (navigate?.(href, scroll)) event.preventDefault();
      }}
    />
  );
}
