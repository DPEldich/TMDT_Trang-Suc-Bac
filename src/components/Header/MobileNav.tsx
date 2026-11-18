'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './MobileNav.module.css';

interface NavItem {
  href: string;
  label: string;
}

const NAV_LINKS: readonly NavItem[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Bộ sưu tập' },
  { href: '/ve-chung-toi', label: 'Về chúng tôi' },
  { href: '/gio-hang', label: 'Giỏ hàng' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
      >
        {isOpen ? (
          <X className={styles.icon} aria-hidden="true" />
        ) : (
          <Menu className={styles.icon} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className={styles.backdrop} onClick={handleClose}>
          <nav
            className={styles.drawer}
            onClick={(e) => e.stopPropagation()}
            aria-label="Menu điều hướng di động"
          >
            <div className={styles.drawerHeader}>
              <span className={styles.brandTitle}>NFA Trang Sức Bạc</span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Đóng menu"
              >
                <X className={styles.icon} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.navMenu}>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={styles.navLink}
                    data-active={isActive}
                    onClick={handleClose}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className={styles.drawerFooter}>
              <p className={styles.footerNote}>
                Trang sức bạc NFA
              </p>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
