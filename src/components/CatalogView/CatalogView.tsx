'use client';

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES, MATERIALS, type Product } from '../../types/product';
import {
  CATALOG_PATH,
  buildCatalogHref,
  getCategoryFilterHref,
  getMaterialFilterHref,
  getPaginationHref,
  parseCategoryParam,
  parseMaterialParam,
  parsePageParam,
  resolveCatalogState,
  type CatalogCategoryFilter,
  type CatalogMaterialFilter,
} from '../../utils/catalog';
import { CategoryFilter } from '../CategoryFilter';
import { MaterialFilter } from '../MaterialFilter';
import { ProductGrid } from '../ProductGrid';
import { Pagination } from '../Pagination';
import styles from './CatalogView.module.css';

export {
  buildCatalogHref,
  parseCategoryParam,
  parseMaterialParam,
  parsePageParam,
};
export type { CatalogCategoryFilter, CatalogMaterialFilter };

export interface CatalogViewProps {
  products: readonly Product[];
}

export function CatalogView({ products }: CatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const pendingPageTargetRef = useRef<number | null>(null);

  const resolved = useMemo(
    () => resolveCatalogState(products, searchParamsKey),
    [products, searchParamsKey]
  );

  const { category, material, categoryCounts, pagination } = resolved;

  useEffect(() => {
    if (resolved.needsNormalization) {
      router.replace(resolved.normalizedHref, { scroll: false });
    }
  }, [resolved.needsNormalization, resolved.normalizedHref, router]);

  useEffect(() => {
    const pendingTarget = pendingPageTargetRef.current;
    if (pendingTarget === null || pendingTarget !== pagination.currentPage) {
      return;
    }
    pendingPageTargetRef.current = null;

    const anchor = resultsAnchorRef.current;
    if (!anchor) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    anchor.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    anchor.focus({ preventScroll: true });
  }, [pagination.currentPage]);

  const activeHeading = useMemo(() => {
    const categoryInfo = CATEGORIES.find((item) => item.id === category);
    const materialInfo = MATERIALS.find((item) => item.id === material);

    if (categoryInfo && materialInfo) {
      return `${categoryInfo.name} — ${materialInfo.name}`;
    }
    if (categoryInfo) return categoryInfo.name;
    if (materialInfo) return `Trang sức ${materialInfo.name}`;
    return 'Tất cả sản phẩm';
  }, [category, material]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      const nextCategory = parseCategoryParam(categoryId);
      if (nextCategory === category) return;
      pendingPageTargetRef.current = null;
      router.push(getCategoryFilterHref(nextCategory, material), {
        scroll: false,
      });
    },
    [router, category, material]
  );

  const handleSelectMaterial = useCallback(
    (nextMaterial: CatalogMaterialFilter) => {
      if (nextMaterial === material) return;
      pendingPageTargetRef.current = null;
      router.push(getMaterialFilterHref(category, nextMaterial), {
        scroll: false,
      });
    },
    [router, category, material]
  );

  const handleResetFilters = useCallback(() => {
    pendingPageTargetRef.current = null;
    router.push(CATALOG_PATH, { scroll: false });
  }, [router]);

  const handlePageNavigate = useCallback((targetPage: number) => {
    pendingPageTargetRef.current = targetPage;
  }, []);

  const getPageHref = useCallback(
    (page: number) => getPaginationHref(category, material, page),
    [category, material]
  );

  const hasActiveFilters = category !== 'all' || material !== 'all';

  return (
    <section className={styles.wrapper} aria-labelledby="catalog-list-heading">
      <h2 id="catalog-list-heading" className={styles.srOnly}>
        {activeHeading}
      </h2>

      <div className={styles.controlsArea}>
        <CategoryFilter
          selectedCategory={category}
          onSelectCategory={handleSelectCategory}
          categoryCounts={categoryCounts}
        />

        <div className={styles.toolbarRow}>
          <MaterialFilter
            selectedMaterial={material}
            onSelectMaterial={handleSelectMaterial}
          />

          <div
            ref={resultsAnchorRef}
            tabIndex={-1}
            className={styles.resultsBar}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className={styles.resultsCount}>
              {pagination.totalItems === 0 ? (
                <>
                  <strong className={styles.bold}>0</strong> sản phẩm
                </>
              ) : pagination.totalPages <= 1 ? (
                <>
                  <strong className={styles.bold}>
                    {pagination.totalItems}
                  </strong>{' '}
                  sản phẩm
                </>
              ) : pagination.startItem === pagination.endItem ? (
                <>
                  <strong className={styles.bold}>
                    {pagination.startItem}
                  </strong>{' '}
                  / {pagination.totalItems} sản phẩm
                </>
              ) : (
                <>
                  <strong className={styles.bold}>
                    {pagination.startItem}–{pagination.endItem}
                  </strong>{' '}
                  / {pagination.totalItems} sản phẩm
                </>
              )}
            </p>

            {pagination.totalPages > 1 && (
              <p className={styles.pageMeta}>
                Trang {pagination.currentPage} / {pagination.totalPages}
              </p>
            )}
          </div>
        </div>
      </div>

      <ProductGrid
        products={pagination.items}
        headingAs="h3"
        emptyMessage="Không có sản phẩm phù hợp với bộ lọc hiện tại."
        resetLabel="Xóa bộ lọc"
        onResetFilter={hasActiveFilters ? handleResetFilters : undefined}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        getPageHref={getPageHref}
        onPageNavigate={handlePageNavigate}
      />
    </section>
  );
}
