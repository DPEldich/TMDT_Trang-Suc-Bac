'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '../../types/product';
import { Container } from '../UI/Container';
import { CurtainLink } from './NavigationCurtain';
import {
  DESKTOP_MEGA_PANEL_IDS,
  extractHomeSectionId,
  HOME_SECTION_LINKS,
  resolveActiveMegaMenu,
  resolveClickMegaMenu,
  resolvePointerEnterMegaMenu,
  resolveScheduledCloseMegaMenu,
  type DesktopMegaMenuId,
  type OpenMegaMenuState,
} from './homeNavigation';
import styles from './DesktopNav.module.css';

interface DesktopNavItem {
  readonly href: string;
  readonly label: string;
  readonly matchPrefix?: string;
  readonly megaMenuId?: DesktopMegaMenuId;
}

const DESKTOP_LINKS: readonly DesktopNavItem[] = [
  { href: '/', label: 'Trang chủ', megaMenuId: 'home' },
  {
    href: '/san-pham',
    label: 'Bộ sưu tập',
    matchPrefix: '/san-pham',
    megaMenuId: 'collection',
  },
  { href: '/ve-chung-toi', label: 'Về chúng tôi' },
];

export function DesktopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<OpenMegaMenuState | null>(null);
  const homeTriggerRef = useRef<HTMLButtonElement>(null);
  const collectionTriggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const aboutLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusFrameRef = useRef<number | null>(null);

  const activeMenuId = resolveActiveMegaMenu(openMenu, pathname);
  const isOpen = activeMenuId !== null;

  const getTriggerElement = useCallback(
    (menuId: DesktopMegaMenuId | null | undefined): HTMLButtonElement | null => {
      if (menuId === 'home') return homeTriggerRef.current;
      if (menuId === 'collection') return collectionTriggerRef.current;
      return null;
    },
    []
  );

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(
    (restoreFocus = false, targetMenuId?: DesktopMegaMenuId | null) => {
      cancelClose();
      const menuToRestore = targetMenuId ?? activeMenuId;
      setOpenMenu(null);
      if (restoreFocus && menuToRestore) {
        getTriggerElement(menuToRestore)?.focus();
      }
    },
    [activeMenuId, cancelClose, getTriggerElement]
  );

  const handleSectionLinkClick = useCallback(
    (href: string) => {
      const sectionId = extractHomeSectionId(href);
      closeMenu();
      if (pathname === '/' && sectionId) {
        requestAnimationFrame(() => {
          document.getElementById(sectionId)?.scrollIntoView();
        });
      }
    },
    [closeMenu, pathname]
  );

  const scheduleClose = useCallback(
    (scheduledForMenuId?: DesktopMegaMenuId) => {
      cancelClose();
      if (openMenu?.pinned) return;
      const menuIdAtSchedule = scheduledForMenuId ?? activeMenuId ?? undefined;
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        const currentActiveTrigger = getTriggerElement(menuIdAtSchedule);
        if (
          panelRef.current?.contains(document.activeElement) ||
          (currentActiveTrigger !== null && document.activeElement === currentActiveTrigger)
        ) {
          return;
        }
        setOpenMenu((current) =>
          resolveScheduledCloseMegaMenu({
            openMenu: current,
            pathname,
            scheduledForMenuId: menuIdAtSchedule,
          })
        );
      }, 160);
    },
    [activeMenuId, cancelClose, getTriggerElement, openMenu?.pinned, pathname]
  );

  const focusFirstLink = useCallback(() => {
    if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = requestAnimationFrame(() => {
      focusFrameRef.current = null;
      panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    });
  }, []);

  const handleTriggerKeyDown = (
    menuId: DesktopMegaMenuId,
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    if (
      event.key === 'ArrowDown' ||
      (event.key === 'Tab' && !event.shiftKey && activeMenuId === menuId)
    ) {
      event.preventDefault();
      cancelClose();
      setOpenMenu({ menuId, path: pathname, pinned: true });
      focusFirstLink();
    } else if (event.key === 'Tab' && event.shiftKey && activeMenuId === menuId) {
      closeMenu();
    }
  };

  const handlePanelKeyDown = (
    menuId: DesktopMegaMenuId,
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key !== 'Tab') return;
    const links = panelRef.current?.querySelectorAll<HTMLAnchorElement>('a');
    if (!links?.length) return;
    if (event.shiftKey && document.activeElement === links[0]) {
      event.preventDefault();
      closeMenu(true, menuId);
    } else if (!event.shiftKey && document.activeElement === links[links.length - 1]) {
      event.preventDefault();
      closeMenu();
      if (menuId === 'home') {
        collectionTriggerRef.current?.focus();
      } else {
        aboutLinkRef.current?.focus();
      }
    }
  };

  const handleBlur = (menuId: DesktopMegaMenuId, event: FocusEvent) => {
    if (activeMenuId !== menuId) return;
    const next = event.relatedTarget;
    const triggerEl = getTriggerElement(menuId);
    if (
      next instanceof Node &&
      !panelRef.current?.contains(next) &&
      next !== triggerEl
    ) {
      closeMenu();
    }
  };

  useEffect(
    () => () => {
      cancelClose();
      if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    },
    [cancelClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !panelRef.current?.contains(target) &&
        !homeTriggerRef.current?.contains(target) &&
        !collectionTriggerRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const handleHistoryChange = () => closeMenu();
    const desktopMedia = window.matchMedia('(min-width: 48rem)');
    const handleResize = (event: MediaQueryListEvent) => {
      if (!event.matches) closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHistoryChange);
    desktopMedia.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener('hashchange', handleHistoryChange);
      desktopMedia.removeEventListener('change', handleResize);
    };
  }, [isOpen, closeMenu]);

  const megaPanelOverlay =
    activeMenuId !== null ? (
      <div className={styles.megaLayer}>
        <div
          className={styles.backdrop}
          aria-hidden="true"
          onPointerEnter={() => scheduleClose(activeMenuId)}
        />
        <div
          key={activeMenuId}
          ref={panelRef}
          id={DESKTOP_MEGA_PANEL_IDS[activeMenuId]}
          className={styles.megaPanel}
          aria-label={
            activeMenuId === 'home' ? 'Điều hướng trang chủ' : 'Bộ sưu tập trang sức'
          }
          onPointerEnter={cancelClose}
          onPointerLeave={() => scheduleClose(activeMenuId)}
          onKeyDown={(event) => handlePanelKeyDown(activeMenuId, event)}
          onBlur={(event) => handleBlur(activeMenuId, event)}
        >
          {activeMenuId === 'home' ? (
            <Container className={clsx(styles.menuGrid, styles.homeMenuGrid)}>
              {HOME_SECTION_LINKS.map((section) => (
                <div key={section.id} className={styles.menuColumn}>
                  <ul className={styles.primaryLinks}>
                    <li>
                      <CurtainLink
                        href={section.href}
                        onClick={() => handleSectionLinkClick(section.href)}
                      >
                        {section.label}
                      </CurtainLink>
                    </li>
                  </ul>
                </div>
              ))}
            </Container>
          ) : (
            <Container className={styles.menuGrid}>
              <div className={styles.menuColumn}>
                <p className={styles.groupLabel}>Khám phá bộ sưu tập</p>
                <ul className={styles.primaryLinks}>
                  <li>
                    <CurtainLink href="/san-pham" onClick={() => closeMenu()}>
                      Tất cả trang sức
                    </CurtainLink>
                  </li>
                  {CATEGORIES.map((category) => (
                    <li key={category.id}>
                      <CurtainLink
                        href={`/san-pham?category=${category.id}`}
                        onClick={() => closeMenu()}
                      >
                        {category.name}
                      </CurtainLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.menuColumn}>
                <p className={styles.groupLabel}>Mua sắm</p>
                <ul className={styles.secondaryLinks}>
                  <li>
                    <CurtainLink
                      href="/#featured-heading"
                      onClick={() => handleSectionLinkClick('/#featured-heading')}
                    >
                      Mẫu nổi bật
                    </CurtainLink>
                  </li>
                  <li>
                    <CurtainLink href="/gio-hang" onClick={() => closeMenu()}>
                      Giỏ hàng
                    </CurtainLink>
                  </li>
                </ul>
              </div>
              <div className={styles.menuColumn}>
                <p className={styles.groupLabel}>Tìm hiểu NFA</p>
                <ul className={styles.secondaryLinks}>
                  <li>
                    <CurtainLink href="/ve-chung-toi" onClick={() => closeMenu()}>
                      Về chúng tôi
                    </CurtainLink>
                  </li>
                  <li>
                    <CurtainLink
                      href="/#feedback-heading"
                      onClick={() => handleSectionLinkClick('/#feedback-heading')}
                    >
                      Đánh giá khách hàng
                    </CurtainLink>
                  </li>
                </ul>
              </div>
            </Container>
          )}
        </div>
      </div>
    ) : null;

  return (
    <nav className={styles.desktopNav} aria-label="Điều hướng chính">
      {DESKTOP_LINKS.map((item) => {
        const isActive = item.matchPrefix
          ? pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
          : pathname === item.href;

        if (item.megaMenuId) {
          const menuId = item.megaMenuId;
          const isMenuOpen = activeMenuId === menuId;
          const triggerRef = menuId === 'home' ? homeTriggerRef : collectionTriggerRef;

          return (
            <div key={item.href} onPointerLeave={() => scheduleClose(menuId)}>
              <button
                ref={triggerRef}
                type="button"
                className={styles.navLink}
                data-active={isActive || isMenuOpen ? 'true' : 'false'}
                aria-expanded={isMenuOpen}
                aria-controls={DESKTOP_MEGA_PANEL_IDS[menuId]}
                onPointerEnter={(event) => {
                  cancelClose();
                  const canHover =
                    event.pointerType === 'mouse' &&
                    window.matchMedia('(hover: hover)').matches;
                  if (canHover && activeMenuId !== menuId && panelRef.current?.contains(document.activeElement)) {
                    triggerRef.current?.focus();
                  }
                  setOpenMenu((current) =>
                    resolvePointerEnterMegaMenu({
                      openMenu: current,
                      pathname,
                      menuId,
                      canHover,
                    })
                  );
                }}
                onClick={() => {
                  cancelClose();
                  setOpenMenu((current) =>
                    resolveClickMegaMenu({
                      openMenu: current,
                      pathname,
                      menuId,
                    })
                  );
                }}
                onKeyDown={(event) => handleTriggerKeyDown(menuId, event)}
                onBlur={(event) => handleBlur(menuId, event)}
              >
                {item.label}
              </button>
            </div>
          );
        }

        return (
          <CurtainLink
            key={item.href}
            ref={item.href === '/ve-chung-toi' ? aboutLinkRef : undefined}
            href={item.href}
            className={styles.navLink}
            data-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            onPointerEnter={() => closeMenu()}
          >
            {item.label}
          </CurtainLink>
        );
      })}
      {megaPanelOverlay && typeof document !== 'undefined'
        ? createPortal(megaPanelOverlay, document.body)
        : null}
    </nav>
  );
}
