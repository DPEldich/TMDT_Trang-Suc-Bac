'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CurtainLink } from './NavigationCurtain';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../../types/product';
import styles from './MobileNav.module.css';

interface NavItem {
  href: string;
  label: string;
  matchPrefix?: string;
}

const NAV_LINKS: readonly NavItem[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Bộ sưu tập', matchPrefix: '/san-pham' },
  { href: '/ve-chung-toi', label: 'Về chúng tôi' },
  { href: '/gio-hang', label: 'Giỏ hàng' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isOpen = openPath === pathname;

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpenPath(null);
    setStatusMessage('Đã đóng menu điều hướng');
    if (restoreFocus) {
      requestAnimationFrame(() => {
        toggleButtonRef.current?.focus();
      });
    }
  }, []);

  const openMenu = useCallback(() => {
    setOpenPath(pathname);
    setStatusMessage('Đã mở menu điều hướng');
  }, [pathname]);

  // Manage body scroll lock, focus entry, focus trap, Escape key, and desktop resize
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const mediaQuery = window.matchMedia('(min-width: 48rem)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpenPath(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      cancelAnimationFrame(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [isOpen, closeMenu]);

  const overlay = isOpen ? (
    <div
      className={styles.backdrop}
      onClick={() => closeMenu(true)}
      data-state="open"
    >
      <div
        ref={dialogRef}
        id="mobile-nav-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng di động"
        className={styles.sheet}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHeader}>
          <span className={styles.brandTitle}>NFA</span>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={() => closeMenu(true)}
            aria-label="Đóng menu điều hướng"
          >
            <X className={styles.icon} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.navMenu} aria-label="Điều hướng chính trên di động">
          {NAV_LINKS.map((link) => {
            const isActive = link.matchPrefix
              ? pathname === link.href || pathname.startsWith(`${link.matchPrefix}/`)
              : pathname === link.href;

            return (
              <CurtainLink
                key={link.href}
                href={link.href}
                className={styles.navLink}
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => closeMenu(false)}
              >
                <span>{link.label}</span>
                <ChevronRight className={styles.chevron} aria-hidden="true" />
              </CurtainLink>
            );
          })}
        </nav>

        <div className={styles.categoryGroup}>
          <p className={styles.groupLabel}>Danh mục sản phẩm</p>
          <div className={styles.categoryLinks}>
            {CATEGORIES.map((category) => (
              <CurtainLink
                key={category.id}
                href={`/san-pham?category=${category.id}`}
                className={styles.categoryLink}
                onClick={() => closeMenu(false)}
              >
                {category.name}
              </CurtainLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.wrapper}>
      <button
        ref={toggleButtonRef}
        type="button"
        className={styles.toggleButton}
        onClick={() => (isOpen ? closeMenu(false) : openMenu())}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-dialog"
        aria-haspopup="dialog"
        aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
      >
        {isOpen ? (
          <X className={styles.icon} aria-hidden="true" />
        ) : (
          <Menu className={styles.icon} aria-hidden="true" />
        )}
      </button>

      <span className={styles.srOnly} role="status" aria-live="polite">
        {statusMessage}
      </span>

      {overlay && typeof document !== 'undefined'
        ? createPortal(overlay, document.body)
        : null}
    </div>
  );
}
