'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type TransitionEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, MATERIALS, type Product } from '../../types/product';
import {
  CATALOG_PATH,
  CATALOG_SORT_OPTIONS,
  buildCatalogHref,
  getCatalogStateHref,
  hasActiveCatalogFilters,
  parseCategoryParam,
  parseMaterialParam,
  parsePageParam,
  parseSortParam,
  resolveCatalogState,
  type CatalogCategoryFilter,
  type CatalogMaterialFilter,
  type CatalogQueryState,
  type CatalogSortOption,
} from '../../utils/catalog';
import { CatalogSearch } from '../CatalogSearch';
import {
  AdvancedFilters,
  type AdvancedFiltersApplyPayload,
} from '../AdvancedFilters';
import { ActiveFilters, type ActiveFilterKey } from '../ActiveFilters';
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
export type {
  CatalogCategoryFilter,
  CatalogMaterialFilter,
  CatalogQueryState,
  CatalogSortOption,
};

export interface CatalogViewProps {
  products: readonly Product[];
}

export function CatalogView({ products }: CatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const searchPanelId = useId();
  const advancedPanelId = useId();
  const sortSelectId = useId();
  const morphShellRef = useRef<HTMLDivElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const pendingPageTargetRef = useRef<number | null>(null);

  const isSearchOpenRef = useRef<boolean>(false);
  const focusSeqRef = useRef<number>(0);
  const pendingFocusTokenRef = useRef<number | null>(null);
  const triggerPointerActiveRef = useRef<boolean>(false);

  const resolved = useMemo(
    () => resolveCatalogState(products, searchParamsKey),
    [products, searchParamsKey]
  );

  const {
    queryState,
    q,
    category,
    material,
    minPrice,
    maxPrice,
    inStock,
    sort,
    categoryCounts,
    pagination,
  } = resolved;

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(
    () => minPrice !== null || maxPrice !== null || inStock
  );

  const cancelPendingInputFocus = useCallback(() => {
    pendingFocusTokenRef.current = null;
  }, []);

  const commitPendingInputFocus = useCallback((expectedToken: number) => {
    if (pendingFocusTokenRef.current !== expectedToken) {
      return;
    }
    pendingFocusTokenRef.current = null;

    if (!isSearchOpenRef.current) {
      return;
    }

    const activeElement = document.activeElement;
    const isFocusStillEligible =
      activeElement === null ||
      activeElement === document.body ||
      activeElement === document.documentElement ||
      activeElement === searchTriggerRef.current;

    if (!isFocusStillEligible) {
      return;
    }

    searchInputRef.current?.focus({ preventScroll: true });
  }, []);

  const openSearchToolbar = useCallback(() => {
    if (isSearchOpenRef.current) {
      return;
    }

    cancelPendingInputFocus();
    const nextToken = focusSeqRef.current + 1;
    focusSeqRef.current = nextToken;
    pendingFocusTokenRef.current = nextToken;
    isSearchOpenRef.current = true;
    setIsSearchOpen(true);
  }, [cancelPendingInputFocus]);

  const closeSearchToolbar = useCallback(
    (options?: { restoreFocus?: boolean }) => {
      cancelPendingInputFocus();
      focusSeqRef.current += 1;

      if (options?.restoreFocus) {
        searchTriggerRef.current?.focus({ preventScroll: true });
      }

      if (!isSearchOpenRef.current) {
        return;
      }

      isSearchOpenRef.current = false;
      setIsSearchOpen(false);
    },
    [cancelPendingInputFocus]
  );

  useEffect(() => {
    isSearchOpenRef.current = isSearchOpen;

    if (!isSearchOpen) {
      cancelPendingInputFocus();
      return;
    }

    const activeToken = pendingFocusTokenRef.current;
    if (activeToken === null) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const shell = morphShellRef.current;
    const hasActiveWidthTransition = (() => {
      if (!shell) {
        return false;
      }
      const computed = window.getComputedStyle(shell);
      const properties = computed.transitionProperty
        .split(',')
        .map((prop) => prop.trim());
      if (properties.every((prop) => prop === 'none')) {
        return false;
      }
      const widthIndex = properties.findIndex(
        (prop) => prop === 'width' || prop === 'all'
      );
      if (widthIndex === -1) {
        return false;
      }
      const durationsMs = computed.transitionDuration
        .split(',')
        .map((token) => {
          const trimmed = token.trim();
          const parsed = Number.parseFloat(trimmed);
          if (!Number.isFinite(parsed)) {
            return 0;
          }
          return trimmed.endsWith('ms') ? parsed : parsed * 1000;
        });
      const widthDurationMs = durationsMs[widthIndex % durationsMs.length] ?? 0;
      return widthDurationMs > 1;
    })();

    if (prefersReducedMotion || !hasActiveWidthTransition) {
      commitPendingInputFocus(activeToken);
      return;
    }

    const handleDocumentFocusIn = (event: FocusEvent) => {
      if (event.target !== searchTriggerRef.current) {
        cancelPendingInputFocus();
      }
    };

    document.addEventListener('focusin', handleDocumentFocusIn, true);

    return () => {
      document.removeEventListener('focusin', handleDocumentFocusIn, true);
    };
  }, [isSearchOpen, cancelPendingInputFocus, commitPendingInputFocus]);

  useEffect(() => {
    return () => {
      cancelPendingInputFocus();
    };
  }, [cancelPendingInputFocus]);

  const handleMorphTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== morphShellRef.current) {
        return;
      }
      if (event.propertyName !== 'width') {
        return;
      }
      if (!isSearchOpenRef.current) {
        return;
      }
      const activeToken = pendingFocusTokenRef.current;
      if (activeToken === null) {
        return;
      }
      commitPendingInputFocus(activeToken);
    },
    [commitPendingInputFocus]
  );

  const handleTriggerPointerDown = useCallback(() => {
    triggerPointerActiveRef.current = true;
  }, []);

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        triggerPointerActiveRef.current = false;
      }
    },
    []
  );

  const handleTriggerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const wasPointer = triggerPointerActiveRef.current || event.detail > 0;
      triggerPointerActiveRef.current = false;

      if (!wasPointer) {
        if (isSearchOpenRef.current) {
          closeSearchToolbar({ restoreFocus: true });
        } else {
          openSearchToolbar();
        }
        return;
      }

      if (event.detail >= 2 && event.detail % 2 === 0) {
        closeSearchToolbar({ restoreFocus: true });
        return;
      }

      openSearchToolbar();
    },
    [closeSearchToolbar, openSearchToolbar]
  );

  const handleTriggerDoubleClick = useCallback(() => {
    closeSearchToolbar({ restoreFocus: true });
  }, [closeSearchToolbar]);

  const handleCloseButtonClick = useCallback(() => {
    closeSearchToolbar({ restoreFocus: true });
  }, [closeSearchToolbar]);

  const handleSearchSystemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        event.key !== 'Escape' ||
        event.nativeEvent.isComposing ||
        !isSearchOpenRef.current
      ) {
        return;
      }
      event.preventDefault();
      closeSearchToolbar({ restoreFocus: true });
    },
    [closeSearchToolbar]
  );

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

    const parts: string[] = [];
    if (categoryInfo) parts.push(categoryInfo.name);
    if (materialInfo) parts.push(materialInfo.name);
    if (q !== '') parts.push(`Tìm kiếm "${q}"`);

    if (parts.length > 0) {
      return parts.join(' — ');
    }
    return 'Tất cả sản phẩm';
  }, [category, material, q]);

  const pushCatalogHref = useCallback(
    (nextHref: string) => {
      pendingPageTargetRef.current = null;
      if (nextHref === resolved.canonicalHref && !resolved.needsNormalization) {
        return;
      }
      router.push(nextHref, { scroll: false });
    },
    [resolved.canonicalHref, resolved.needsNormalization, router]
  );

  const handleSubmitQuery = useCallback(
    (nextQuery: string) => {
      pushCatalogHref(
        getCatalogStateHref(queryState, { q: nextQuery }, { resetPage: true })
      );
    },
    [pushCatalogHref, queryState]
  );

  const handleApplyAdvancedFilters = useCallback(
    (next: AdvancedFiltersApplyPayload) => {
      pushCatalogHref(
        getCatalogStateHref(
          queryState,
          {
            minPrice: next.minPrice,
            maxPrice: next.maxPrice,
            inStock: next.inStock,
          },
          { resetPage: true }
        )
      );
    },
    [pushCatalogHref, queryState]
  );

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      const nextCategory = parseCategoryParam(categoryId);
      if (nextCategory === category) return;
      pushCatalogHref(
        getCatalogStateHref(
          queryState,
          { category: nextCategory },
          { resetPage: true }
        )
      );
    },
    [category, pushCatalogHref, queryState]
  );

  const handleSelectMaterial = useCallback(
    (nextMaterial: CatalogMaterialFilter) => {
      if (nextMaterial === material) return;
      pushCatalogHref(
        getCatalogStateHref(
          queryState,
          { material: nextMaterial },
          { resetPage: true }
        )
      );
    },
    [material, pushCatalogHref, queryState]
  );

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextSort = parseSortParam(event.target.value);
      if (nextSort === sort) return;
      pushCatalogHref(
        getCatalogStateHref(queryState, { sort: nextSort }, { resetPage: true })
      );
    },
    [pushCatalogHref, queryState, sort]
  );

  const handleRemoveFilter = useCallback(
    (key: ActiveFilterKey) => {
      switch (key) {
        case 'q':
          pushCatalogHref(
            getCatalogStateHref(queryState, { q: '' }, { resetPage: true })
          );
          return;
        case 'category':
          pushCatalogHref(
            getCatalogStateHref(
              queryState,
              { category: 'all' },
              { resetPage: true }
            )
          );
          return;
        case 'material':
          pushCatalogHref(
            getCatalogStateHref(
              queryState,
              { material: 'all' },
              { resetPage: true }
            )
          );
          return;
        case 'minPrice':
          pushCatalogHref(
            getCatalogStateHref(
              queryState,
              { minPrice: null },
              { resetPage: true }
            )
          );
          return;
        case 'maxPrice':
          pushCatalogHref(
            getCatalogStateHref(
              queryState,
              { maxPrice: null },
              { resetPage: true }
            )
          );
          return;
        case 'inStock':
          pushCatalogHref(
            getCatalogStateHref(
              queryState,
              { inStock: false },
              { resetPage: true }
            )
          );
          return;
      }
    },
    [pushCatalogHref, queryState]
  );

  const handleResetFilters = useCallback(() => {
    pushCatalogHref(CATALOG_PATH);
  }, [pushCatalogHref]);

  const handlePageNavigate = useCallback((targetPage: number) => {
    pendingPageTargetRef.current = targetPage;
  }, []);

  const getPageHref = useCallback(
    (page: number) =>
      getCatalogStateHref(queryState, { page }, { resetPage: false }),
    [queryState]
  );

  const hasActiveFilters = hasActiveCatalogFilters(queryState);
  const activeAdvancedCount =
    (minPrice !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    (inStock ? 1 : 0);
  const isAdvancedVisible = isSearchOpen && isAdvancedOpen;

  const emptyMessage =
    q !== ''
      ? 'Không tìm thấy sản phẩm phù hợp với từ khóa và bộ lọc hiện tại.'
      : 'Không có sản phẩm phù hợp với bộ lọc hiện tại.';

  return (
    <section className={styles.wrapper} aria-labelledby="catalog-list-heading">
      <h2 id="catalog-list-heading" className={styles.srOnly}>
        {activeHeading}
      </h2>

      <div className={styles.controlsArea}>
        <div
          className={styles.searchSystem}
          data-state={isSearchOpen ? 'open' : 'closed'}
          onKeyDown={handleSearchSystemKeyDown}
        >
          <div
            ref={morphShellRef}
            className={styles.searchMorphShell}
            data-state={isSearchOpen ? 'open' : 'closed'}
            onTransitionEnd={handleMorphTransitionEnd}
          >
            <button
              ref={searchTriggerRef}
              type="button"
              className={styles.searchTrigger}
              aria-expanded={isSearchOpen}
              aria-controls={searchPanelId}
              aria-label="Tìm kiếm và bộ lọc"
              data-state={isSearchOpen ? 'open' : 'closed'}
              onPointerDown={handleTriggerPointerDown}
              onKeyDown={handleTriggerKeyDown}
              onClick={handleTriggerClick}
              onDoubleClick={handleTriggerDoubleClick}
            >
              <Search
                className={styles.searchTriggerIcon}
                aria-hidden="true"
              />
            </button>

            <div
              id={searchPanelId}
              className={styles.searchMorphClip}
              aria-hidden={!isSearchOpen}
              inert={!isSearchOpen}
            >
              <div className={styles.searchMorphInner}>
                <div className={styles.searchBarRow}>
                  <CatalogSearch
                    committedQuery={q}
                    syncKey={searchParamsKey}
                    onSubmitQuery={handleSubmitQuery}
                    inputRef={searchInputRef}
                    variant="morph"
                    className={styles.searchControl}
                  />

                  <div className={styles.topBarActions}>
                    <button
                      type="button"
                      className={styles.advancedToggle}
                      aria-expanded={isAdvancedOpen}
                      aria-controls={advancedPanelId}
                      data-state={isAdvancedOpen ? 'open' : 'closed'}
                      data-active={activeAdvancedCount > 0 ? 'true' : 'false'}
                      onClick={() => setIsAdvancedOpen((open) => !open)}
                    >
                      <SlidersHorizontal
                        className={styles.toggleIcon}
                        aria-hidden="true"
                      />
                      <span>Bộ lọc nâng cao</span>
                      {activeAdvancedCount > 0 && (
                        <span className={styles.activeBadge}>
                          {activeAdvancedCount}
                        </span>
                      )}
                    </button>

                    <div className={styles.sortControl}>
                      <label htmlFor={sortSelectId} className={styles.sortLabel}>
                        Sắp xếp
                      </label>
                      <div className={styles.sortSelectWrapper}>
                        <select
                          id={sortSelectId}
                          value={sort}
                          onChange={handleSortChange}
                          className={styles.sortSelect}
                          data-active={sort !== 'default' ? 'true' : 'false'}
                        >
                          {CATALOG_SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={styles.sortChevron}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.closeTrigger}
                  onClick={handleCloseButtonClick}
                  aria-label="Thu gọn tìm kiếm"
                >
                  <X className={styles.closeTriggerIcon} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={styles.advancedCollapse}
            data-state={isAdvancedVisible ? 'open' : 'closed'}
            aria-hidden={!isAdvancedVisible}
            inert={!isAdvancedVisible}
          >
            <div className={styles.advancedCollapseInner}>
              <div className={styles.advancedPanelSpacing}>
                <AdvancedFilters
                  id={advancedPanelId}
                  syncKey={searchParamsKey}
                  committedMinPrice={minPrice}
                  committedMaxPrice={maxPrice}
                  committedInStock={inStock}
                  onApply={handleApplyAdvancedFilters}
                />
              </div>
            </div>
          </div>
        </div>

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

        <ActiveFilters
          queryState={queryState}
          onRemoveFilter={handleRemoveFilter}
          onResetAll={handleResetFilters}
        />
      </div>

      <ProductGrid
        products={pagination.items}
        headingAs="h3"
        emptyMessage={emptyMessage}
        resetLabel="Xóa tất cả"
        onResetFilter={
          hasActiveFilters || sort !== 'default'
            ? handleResetFilters
            : undefined
        }
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
