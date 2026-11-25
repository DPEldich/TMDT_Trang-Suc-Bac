'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CurtainLink } from './NavigationCurtain';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '../../types/product';
import { Container } from '../UI/Container';
import styles from './DesktopNav.module.css';

interface DesktopNavItem {
  href: string;
  label: string;
  matchPrefix?: string;
}

const DESKTOP_LINKS: readonly DesktopNavItem[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Bộ sưu tập', matchPrefix: '/san-pham' },
  { href: '/ve-chung-toi', label: 'Về chúng tôi' },
];

export function DesktopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<{ path: string; pinned: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const nextLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const isOpen = openMenu?.path === pathname;

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback((restoreFocus = false) => {
    cancelClose();
    setOpenMenu(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, [cancelClose]);

  const scheduleClose = () => {
    cancelClose();
    if (openMenu?.pinned) return;
    closeTimerRef.current = setTimeout(() => {
      if (panelRef.current?.contains(document.activeElement) || document.activeElement === triggerRef.current) return;
      closeMenu();
    }, 160);
  };

  const focusFirstLink = () => {
    if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey && isOpen)) {
      event.preventDefault();
      cancelClose();
      setOpenMenu({ path: pathname, pinned: true });
      focusFirstLink();
    } else if (event.key === 'Tab' && event.shiftKey) {
      closeMenu();
    }
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const links = panelRef.current?.querySelectorAll<HTMLAnchorElement>('a');
    if (!links?.length) return;
    if (event.shiftKey && document.activeElement === links[0]) {
      event.preventDefault();
      closeMenu(true);
    } else if (!event.shiftKey && document.activeElement === links[links.length - 1]) {
      event.preventDefault();
      closeMenu();
      nextLinkRef.current?.focus();
    }
  };

  const handleBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || (!panelRef.current?.contains(next) && next !== triggerRef.current)) {
      closeMenu();
    }
  };

  useEffect(() => () => {
    cancelClose();
    if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
  }, [cancelClose]);

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
      if (target instanceof Node && !panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
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
    desktopMedia.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('popstate', handleHistoryChange);
      desktopMedia.removeEventListener('change', handleResize);
    };
  }, [isOpen, closeMenu]);

  const collectionPanel = isOpen ? (
    <div className={styles.megaLayer}>
      <div className={styles.backdrop} aria-hidden="true" onPointerEnter={scheduleClose} />
      <div
        ref={panelRef}
        id="collection-navigation"
        className={styles.megaPanel}
        aria-label="Bộ sưu tập trang sức"
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onKeyDown={handlePanelKeyDown}
        onBlur={handleBlur}
      >
        <Container className={styles.menuGrid}>
          <div className={styles.menuColumn}>
            <p className={styles.groupLabel}>Khám phá bộ sưu tập</p>
            <ul className={styles.primaryLinks}>
              <li><CurtainLink href="/san-pham" onClick={() => closeMenu()}>Tất cả trang sức</CurtainLink></li>
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <CurtainLink href={`/san-pham?category=${category.id}`} onClick={() => closeMenu()}>
                    {category.name}
                  </CurtainLink>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.menuColumn}>
            <p className={styles.groupLabel}>Mua sắm</p>
            <ul className={styles.secondaryLinks}>
              <li><CurtainLink href="/#featured-heading" onClick={() => closeMenu()}>Mẫu nổi bật</CurtainLink></li>
              <li><CurtainLink href="/gio-hang" onClick={() => closeMenu()}>Giỏ hàng</CurtainLink></li>
            </ul>
          </div>
          <div className={styles.menuColumn}>
            <p className={styles.groupLabel}>Tìm hiểu NFA</p>
            <ul className={styles.secondaryLinks}>
              <li><CurtainLink href="/ve-chung-toi" onClick={() => closeMenu()}>Về chúng tôi</CurtainLink></li>
              <li><CurtainLink href="/#feedback-heading" onClick={() => closeMenu()}>Đánh giá khách hàng</CurtainLink></li>
            </ul>
          </div>
        </Container>
      </div>
    </div>
  ) : null;

  return (
    <nav className={styles.desktopNav} aria-label="Điều hướng chính">
      {DESKTOP_LINKS.map((item) => {
        const isActive = item.matchPrefix
          ? pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
          : pathname === item.href;

        if (item.href === '/san-pham') {
          return (
            <div key={item.href} onPointerLeave={scheduleClose}>
              <button
                ref={triggerRef}
                type="button"
                className={styles.navLink}
                data-active={isActive || isOpen ? 'true' : 'false'}
                aria-expanded={isOpen}
                aria-controls="collection-navigation"
                onPointerEnter={(event) => {
                  cancelClose();
                  if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches && !isOpen) {
                    setOpenMenu({ path: pathname, pinned: false });
                  }
                }}
                onClick={() => {
                  cancelClose();
                  setOpenMenu(isOpen && openMenu?.pinned ? null : { path: pathname, pinned: true });
                }}
                onKeyDown={handleTriggerKeyDown}
                onBlur={handleBlur}
              >
                {item.label}
              </button>
              {collectionPanel && typeof document !== 'undefined' ? createPortal(collectionPanel, document.body) : null}
            </div>
          );
        }

        return (
          <CurtainLink
            key={item.href}
            ref={item.href === '/ve-chung-toi' ? nextLinkRef : undefined}
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
    </nav>
  );
}
