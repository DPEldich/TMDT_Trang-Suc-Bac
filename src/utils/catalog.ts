import {
  CATEGORIES,
  MATERIALS,
  type Product,
  type ProductCategory,
  type ProductMaterial,
} from '../types/product';

export const CATALOG_PATH = '/san-pham';
export const CATALOG_PAGE_SIZE = 12;

export type CatalogCategoryFilter = 'all' | ProductCategory;
export type CatalogMaterialFilter = 'all' | ProductMaterial;
export type RawQueryParam = string | readonly string[] | null | undefined;

export interface CatalogQueryInput {
  category?: CatalogCategoryFilter;
  material?: CatalogMaterialFilter;
  page?: number;
}

export interface SearchParamsLike {
  getAll(name: string): string[];
  entries(): IterableIterator<[string, string]>;
}

export type CatalogSearchParamsInput =
  | SearchParamsLike
  | string
  | Readonly<Record<string, RawQueryParam>>
  | null
  | undefined;

export interface CatalogPaginationResult<T> {
  items: readonly T[];
  totalItems: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  startItem: number;
  endItem: number;
}

export interface ResolvedCatalogState<T> {
  category: CatalogCategoryFilter;
  material: CatalogMaterialFilter;
  requestedPage: number;
  filteredProducts: readonly T[];
  categoryCounts: Record<CatalogCategoryFilter, number>;
  pagination: CatalogPaginationResult<T>;
  canonicalHref: string;
  normalizedHref: string;
  needsNormalization: boolean;
}

const STRICT_POSITIVE_INT_PATTERN = /^[1-9]\d*$/;
const MANAGED_QUERY_KEYS = new Set(['category', 'material', 'page']);

function extractFirstParam(raw: RawQueryParam): string | null {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0] : null;
  }
  return null;
}

export function parseCategoryParam(raw: RawQueryParam): CatalogCategoryFilter {
  const value = extractFirstParam(raw);
  if (value === null) return 'all';
  const normalized = value.trim().toLowerCase();
  const matched = CATEGORIES.find((category) => category.id === normalized);
  return matched ? matched.id : 'all';
}

export function parseMaterialParam(raw: RawQueryParam): CatalogMaterialFilter {
  const value = extractFirstParam(raw);
  if (value === null) return 'all';
  const normalized = value.trim().toLowerCase();
  const matched = MATERIALS.find((material) => material.id === normalized);
  return matched ? matched.id : 'all';
}

/**
 * Strictly parses a positive safe integer in canonical base-10 syntax (e.g. "1", "2", "12").
 * Rejects missing, empty, whitespace, leading zeros, signs, decimals, exponential/hex,
 * non-numeric suffixes, and unsafe integers -> returns 1.
 */
export function parsePageParam(raw: RawQueryParam): number {
  const value = extractFirstParam(raw);
  if (value === null || !STRICT_POSITIVE_INT_PATTERN.test(value)) {
    return 1;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function buildCatalogHref({
  category = 'all',
  material = 'all',
  page = 1,
}: CatalogQueryInput = {}): string {
  const params = new URLSearchParams();

  if (category !== 'all') {
    params.set('category', category);
  }
  if (material !== 'all') {
    params.set('material', material);
  }
  if (Number.isSafeInteger(page) && page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
}

export function getCategoryFilterHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter
): string {
  return buildCatalogHref({ category, material, page: 1 });
}

export function getMaterialFilterHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter
): string {
  return buildCatalogHref({ category, material, page: 1 });
}

export function getPaginationHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter,
  page: number
): string {
  return buildCatalogHref({ category, material, page });
}

export function filterCatalogProducts<
  T extends Pick<Product, 'category' | 'material'>,
>(
  products: readonly T[],
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter
): T[] {
  return products.filter((product) => {
    if (category !== 'all' && product.category !== category) {
      return false;
    }
    if (material !== 'all' && product.material !== material) {
      return false;
    }
    return true;
  });
}

export function getCategoryCountsForMaterial<
  T extends Pick<Product, 'category' | 'material'>,
>(
  products: readonly T[],
  material: CatalogMaterialFilter
): Record<CatalogCategoryFilter, number> {
  const counts: Record<CatalogCategoryFilter, number> = {
    all: 0,
    nhan: 0,
    'day-chuyen': 0,
    'lac-tay': 0,
    'bong-tai': 0,
    'lac-chan': 0,
  };

  for (const product of products) {
    if (material !== 'all' && product.material !== material) {
      continue;
    }
    counts.all += 1;
    counts[product.category] += 1;
  }

  return counts;
}

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = CATALOG_PAGE_SIZE
): CatalogPaginationResult<T> {
  const safePageSize =
    Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : CATALOG_PAGE_SIZE;
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safePageSize);
  const safeRequested =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const currentPage = totalPages === 0 ? 1 : Math.min(safeRequested, totalPages);

  if (totalItems === 0) {
    return {
      items: [],
      totalItems: 0,
      pageSize: safePageSize,
      totalPages: 0,
      currentPage: 1,
      startItem: 0,
      endItem: 0,
    };
  }

  const startOffset = (currentPage - 1) * safePageSize;
  const pageItems = items.slice(startOffset, startOffset + safePageSize);

  return {
    items: pageItems,
    totalItems,
    pageSize: safePageSize,
    totalPages,
    currentPage,
    startItem: startOffset + 1,
    endItem: startOffset + pageItems.length,
  };
}

export function formatCatalogRangeSummary(
  pagination: Pick<
    CatalogPaginationResult<unknown>,
    'totalItems' | 'startItem' | 'endItem' | 'totalPages'
  >
): string {
  if (pagination.totalItems === 0) {
    return '0 sản phẩm';
  }
  if (pagination.totalPages <= 1) {
    return `${pagination.totalItems} sản phẩm`;
  }
  if (pagination.startItem === pagination.endItem) {
    return `${pagination.startItem} / ${pagination.totalItems} sản phẩm`;
  }
  return `${pagination.startItem}\u2013${pagination.endItem} / ${pagination.totalItems} sản phẩm`;
}

function isSearchParamsLike(value: unknown): value is SearchParamsLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getAll' in value &&
    typeof value.getAll === 'function' &&
    'entries' in value &&
    typeof value.entries === 'function'
  );
}

function toEntries(input: CatalogSearchParamsInput): Array<[string, string]> {
  if (input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string') {
    const queryIndex = input.indexOf('?');
    let queryString: string;
    if (queryIndex !== -1) {
      queryString = input.slice(queryIndex + 1);
    } else if (input.startsWith('/')) {
      queryString = '';
    } else {
      queryString = input;
    }
    const hashIndex = queryString.indexOf('#');
    if (hashIndex !== -1) {
      queryString = queryString.slice(0, hashIndex);
    }
    return Array.from(new URLSearchParams(queryString).entries());
  }

  if (isSearchParamsLike(input)) {
    return Array.from(input.entries());
  }

  const entries: Array<[string, string]> = [];
  for (const [key, raw] of Object.entries(input)) {
    if (typeof raw === 'string') {
      entries.push([key, raw]);
    } else if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === 'string') {
          entries.push([key, item]);
        }
      }
    }
  }
  return entries;
}

function sameStringArray(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

export function resolveCatalogState<
  T extends Pick<Product, 'category' | 'material'>,
>(
  products: readonly T[],
  input: CatalogSearchParamsInput,
  pageSize = CATALOG_PAGE_SIZE
): ResolvedCatalogState<T> {
  const entries = toEntries(input);
  const rawCategories: string[] = [];
  const rawMaterials: string[] = [];
  const rawPages: string[] = [];
  const preservedExtraEntries: Array<[string, string]> = [];

  for (const [key, value] of entries) {
    if (key === 'category') {
      rawCategories.push(value);
    } else if (key === 'material') {
      rawMaterials.push(value);
    } else if (key === 'page') {
      rawPages.push(value);
    } else if (!MANAGED_QUERY_KEYS.has(key)) {
      preservedExtraEntries.push([key, value]);
    }
  }

  const category = parseCategoryParam(rawCategories);
  const material = parseMaterialParam(rawMaterials);
  const requestedPage = parsePageParam(rawPages);

  const filteredProducts = filterCatalogProducts(products, category, material);
  const categoryCounts = getCategoryCountsForMaterial(products, material);
  const pagination = paginateItems(filteredProducts, requestedPage, pageSize);

  const canonicalHref = buildCatalogHref({
    category,
    material,
    page: pagination.currentPage,
  });

  const normalizedParams = new URLSearchParams();
  if (category !== 'all') {
    normalizedParams.set('category', category);
  }
  if (material !== 'all') {
    normalizedParams.set('material', material);
  }
  if (pagination.currentPage > 1) {
    normalizedParams.set('page', String(pagination.currentPage));
  }
  for (const [extraKey, extraValue] of preservedExtraEntries) {
    normalizedParams.append(extraKey, extraValue);
  }
  const normalizedQuery = normalizedParams.toString();
  const normalizedHref = normalizedQuery
    ? `${CATALOG_PATH}?${normalizedQuery}`
    : CATALOG_PATH;

  const expectedCategories = category === 'all' ? [] : [category];
  const expectedMaterials = material === 'all' ? [] : [material];
  const expectedPages =
    pagination.currentPage <= 1 ? [] : [String(pagination.currentPage)];

  const needsNormalization =
    !sameStringArray(rawCategories, expectedCategories) ||
    !sameStringArray(rawMaterials, expectedMaterials) ||
    !sameStringArray(rawPages, expectedPages);

  return {
    category,
    material,
    requestedPage,
    filteredProducts,
    categoryCounts,
    pagination,
    canonicalHref,
    normalizedHref,
    needsNormalization,
  };
}
