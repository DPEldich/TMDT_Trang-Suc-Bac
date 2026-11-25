'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  onPageNavigate?: (page: number) => void;
  className?: string;
}

function isModifiedLinkClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function Pagination({
  currentPage,
  totalPages,
  getPageHref,
  onPageNavigate,
  className,
}: PaginationProps) {
  if (!Number.isSafeInteger(totalPages) || totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const hasPrevious = safeCurrentPage > 1;
  const hasNext = safeCurrentPage < totalPages;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    targetPage: number
  ) => {
    if (isModifiedLinkClick(event)) {
      return;
    }
    onPageNavigate?.(targetPage);
  };

  return (
    <nav
      className={clsx(styles.nav, className)}
      aria-label="Phân trang danh mục sản phẩm"
    >
      <div className={styles.controls}>
        <div className={styles.prevSlot}>
          {hasPrevious ? (
            <Link
              href={getPageHref(safeCurrentPage - 1)}
              scroll={false}
              className={clsx(
                styles.control,
                styles.stepControl,
                styles.interactive
              )}
              aria-label={`Trang trước, trang ${safeCurrentPage - 1}`}
              onClick={(event) => handleLinkClick(event, safeCurrentPage - 1)}
            >
              <ChevronLeft className={styles.icon} aria-hidden="true" />
              <span>Trước</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className={clsx(
                styles.control,
                styles.stepControl,
                styles.disabled
              )}
              aria-label="Trang trước"
            >
              <ChevronLeft className={styles.icon} aria-hidden="true" />
              <span>Trước</span>
            </button>
          )}
        </div>

        <ol className={styles.pageList}>
          {pages.map((page) => {
            const isCurrent = page === safeCurrentPage;

            return (
              <li key={page} className={styles.pageItem}>
                {isCurrent ? (
                  <span
                    className={clsx(
                      styles.control,
                      styles.pageControl,
                      styles.current
                    )}
                    aria-current="page"
                    data-state="active"
                  >
                    <span className={styles.srOnly}>Trang </span>
                    {page}
                  </span>
                ) : (
                  <Link
                    href={getPageHref(page)}
                    scroll={false}
                    className={clsx(
                      styles.control,
                      styles.pageControl,
                      styles.interactive
                    )}
                    aria-label={`Trang ${page}`}
                    data-state="inactive"
                    onClick={(event) => handleLinkClick(event, page)}
                  >
                    {page}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <div className={styles.nextSlot}>
          {hasNext ? (
            <Link
              href={getPageHref(safeCurrentPage + 1)}
              scroll={false}
              className={clsx(
                styles.control,
                styles.stepControl,
                styles.interactive
              )}
              aria-label={`Trang sau, trang ${safeCurrentPage + 1}`}
              onClick={(event) => handleLinkClick(event, safeCurrentPage + 1)}
            >
              <span>Sau</span>
              <ChevronRight className={styles.icon} aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className={clsx(
                styles.control,
                styles.stepControl,
                styles.disabled
              )}
              aria-label="Trang sau"
            >
              <span>Sau</span>
              <ChevronRight className={styles.icon} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
