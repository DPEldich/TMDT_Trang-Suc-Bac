import {
  CATEGORIES,
  MATERIALS,
  getItemTypeLabel,
  type Product,
  type ProductCategory,
  type ProductMaterial,
} from '../types/product';

export const CATALOG_PATH = '/san-pham';
export const CATALOG_PAGE_SIZE = 12;
export const CATALOG_QUERY_MAX_LENGTH = 100;

export type CatalogCategoryFilter = 'all' | ProductCategory;
export type CatalogMaterialFilter = 'all' | ProductMaterial;
export type CatalogSortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
export type RawQueryParam = string | readonly string[] | null | undefined;

export interface CatalogSortChoice {
  value: CatalogSortOption;
  label: string;
}

export const CATALOG_SORT_OPTIONS: readonly CatalogSortChoice[] = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá: Thấp đến cao' },
  { value: 'price-desc', label: 'Giá: Cao đến thấp' },
  { value: 'name-asc', label: 'Tên: A–Z' },
] as const;

export interface CatalogQueryState {
  q: string;
  category: CatalogCategoryFilter;
  material: CatalogMaterialFilter;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: CatalogSortOption;
  page: number;
}

export interface CatalogQueryInput {
  q?: string;
  category?: CatalogCategoryFilter;
  material?: CatalogMaterialFilter;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  sort?: CatalogSortOption;
  page?: number;
}

export interface CatalogFilterCriteria {
  q?: string;
  category?: CatalogCategoryFilter;
  material?: CatalogMaterialFilter;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
}

export type CatalogQueryableProduct = Pick<
  Product,
  'name' | 'sku' | 'category' | 'material' | 'price' | 'stock'
> &
  Partial<Pick<Product, 'itemType'>>;

export type PriceInputErrorCode =
  | 'invalid-format'
  | 'unsafe-integer'
  | 'range-reversed';

export interface PriceInputParseResult {
  valid: boolean;
  value: number | null;
  error: string | null;
  errorCode: PriceInputErrorCode | null;
}

export interface PriceRangeValidationResult {
  valid: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  minError: string | null;
  maxError: string | null;
  firstInvalidField: 'minPrice' | 'maxPrice' | null;
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
  queryState: CatalogQueryState;
  q: string;
  category: CatalogCategoryFilter;
  material: CatalogMaterialFilter;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: CatalogSortOption;
  requestedPage: number;
  filteredProducts: readonly T[];
  categoryCounts: Record<CatalogCategoryFilter, number>;
  pagination: CatalogPaginationResult<T>;
  canonicalHref: string;
  normalizedHref: string;
  needsNormalization: boolean;
}

const STRICT_POSITIVE_INT_PATTERN = /^[1-9]\d*$/;
const STRICT_NONNEGATIVE_INT_PATTERN = /^(?:0|[1-9]\d*)$/;
const GROUPED_VND_INT_PATTERN = /^(?:[1-9]\d{0,2})(?:\.\d{3})+$/;

const MANAGED_QUERY_KEYS = new Set([
  'q',
  'category',
  'material',
  'minPrice',
  'maxPrice',
  'inStock',
  'sort',
  'page',
]);

const CATEGORY_NAME_MAP: Readonly<Record<ProductCategory, string>> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.name])
) as Readonly<Record<ProductCategory, string>>;

const MATERIAL_NAME_MAP: Readonly<Record<ProductMaterial, string>> = Object.fromEntries(
  MATERIALS.map((material) => [material.id, material.name])
) as Readonly<Record<ProductMaterial, string>>;

const VI_NAME_COLLATOR = new Intl.Collator('vi', { numeric: true });

function extractFirstParam(raw: RawQueryParam): string | null {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0] : null;
  }
  return null;
}

/**
 * Normalizes a human-readable search query:
 * NFC normalization, collapse/trim whitespace, bounded to 100 code points, accents preserved.
 */
export function normalizeSearchQuery(raw: RawQueryParam): string {
  const value = extractFirstParam(raw);
  if (value === null) return '';

  const collapsed = value.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';

  const codePoints = Array.from(collapsed);
  if (codePoints.length <= CATALOG_QUERY_MAX_LENGTH) {
    return collapsed;
  }
  return codePoints.slice(0, CATALOG_QUERY_MAX_LENGTH).join('').trim();
}

export function parseQueryParam(raw: RawQueryParam): string {
  return normalizeSearchQuery(raw);
}

/**
 * Normalizes Vietnamese/Latin text for accent-insensitive, case-insensitive, đ->d matching.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
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
 * Strictly parses a nonnegative safe integer in canonical base-10 URL syntax (e.g. "0", "300000").
 * Rejects missing, empty, whitespace, leading zeros like "0500", signs, decimals, dots,
 * exponential/hex, non-numeric characters, and unsafe integers -> returns null.
 */
export function parsePriceParam(raw: RawQueryParam): number | null {
  const value = extractFirstParam(raw);
  if (value === null || !STRICT_NONNEGATIVE_INT_PATTERN.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

/**
 * Parses URL minPrice/maxPrice bounds:
 * - Invalid bounds are individually removed.
 * - A reversed valid pair (minPrice > maxPrice) is removed together.
 * - minPrice === 0 is treated as default (unrestricted -> null).
 * - maxPrice === 0 remains valid and active.
 */
export function parseCatalogPriceRange(
  rawMin: RawQueryParam,
  rawMax: RawQueryParam
): { minPrice: number | null; maxPrice: number | null } {
  const parsedMin = parsePriceParam(rawMin);
  const parsedMax = parsePriceParam(rawMax);

  if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
    return { minPrice: null, maxPrice: null };
  }

  return {
    minPrice: parsedMin !== null && parsedMin > 0 ? parsedMin : null,
    maxPrice: parsedMax,
  };
}

/**
 * Validates and parses a single UI price field.
 * Accepts empty string (unrestricted), canonical plain digits ("0", "500000"),
 * or properly grouped Vietnamese thousands ("500.000", "1.250.000").
 * Rejects negatives, decimals ("1.5", "0.500"), scientific/hex, commas, non-numeric, and unsafe ints.
 */
export function parsePriceInput(raw: string): PriceInputParseResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { valid: true, value: null, error: null, errorCode: null };
  }

  let digitsOnly: string | null = null;
  if (STRICT_NONNEGATIVE_INT_PATTERN.test(trimmed)) {
    digitsOnly = trimmed;
  } else if (GROUPED_VND_INT_PATTERN.test(trimmed)) {
    digitsOnly = trimmed.replace(/\./g, '');
  }

  if (digitsOnly === null) {
    return {
      valid: false,
      value: null,
      error: 'Nhập số nguyên không âm (ví dụ: 500000 hoặc 500.000).',
      errorCode: 'invalid-format',
    };
  }

  const parsed = Number(digitsOnly);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return {
      valid: false,
      value: null,
      error: 'Giá trị vượt quá giới hạn hợp lệ.',
      errorCode: 'unsafe-integer',
    };
  }

  return { valid: true, value: parsed, error: null, errorCode: null };
}

/**
 * Validates the UI price range pair before committing filters.
 * Rejects invalid formats, unsafe integers, and reversed bounds (min > max).
 * Normalizes valid min === 0 to null (default) while preserving valid max === 0.
 */
export function validatePriceRangeInputs(
  minRaw: string,
  maxRaw: string
): PriceRangeValidationResult {
  const minResult = parsePriceInput(minRaw);
  const maxResult = parsePriceInput(maxRaw);

  if (!minResult.valid || !maxResult.valid) {
    return {
      valid: false,
      minPrice: null,
      maxPrice: null,
      minError: minResult.error,
      maxError: maxResult.error,
      firstInvalidField: !minResult.valid ? 'minPrice' : 'maxPrice',
    };
  }

  if (
    minResult.value !== null &&
    maxResult.value !== null &&
    minResult.value > maxResult.value
  ) {
    return {
      valid: false,
      minPrice: null,
      maxPrice: null,
      minError: 'Giá từ không được lớn hơn Giá đến.',
      maxError: null,
      firstInvalidField: 'minPrice',
    };
  }

  return {
    valid: true,
    minPrice:
      minResult.value !== null && minResult.value > 0 ? minResult.value : null,
    maxPrice: maxResult.value,
    minError: null,
    maxError: null,
    firstInvalidField: null,
  };
}

export function parseInStockParam(raw: RawQueryParam): boolean {
  const value = extractFirstParam(raw);
  return value === '1';
}

export function parseSortParam(raw: RawQueryParam): CatalogSortOption {
  const value = extractFirstParam(raw);
  if (value === null) return 'default';
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'price-asc' ||
    normalized === 'price-desc' ||
    normalized === 'name-asc'
  ) {
    return normalized;
  }
  return 'default';
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

function normalizeProgrammaticPriceBounds(
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined
): { minPrice: number | null; maxPrice: number | null } {
  const validMin =
    typeof minPrice === 'number' && Number.isSafeInteger(minPrice) && minPrice >= 0
      ? minPrice
      : null;
  const validMax =
    typeof maxPrice === 'number' && Number.isSafeInteger(maxPrice) && maxPrice >= 0
      ? maxPrice
      : null;

  if (validMin !== null && validMax !== null && validMin > validMax) {
    return { minPrice: null, maxPrice: null };
  }

  return {
    minPrice: validMin !== null && validMin > 0 ? validMin : null,
    maxPrice: validMax,
  };
}

export function normalizeCatalogQueryInput(
  input: CatalogQueryInput = {}
): CatalogQueryState {
  const q = normalizeSearchQuery(input.q ?? '');
  const category = parseCategoryParam(input.category ?? 'all');
  const material = parseMaterialParam(input.material ?? 'all');
  const { minPrice, maxPrice } = normalizeProgrammaticPriceBounds(
    input.minPrice,
    input.maxPrice
  );
  const inStock = Boolean(input.inStock);
  const sort = parseSortParam(input.sort ?? 'default');
  const page =
    typeof input.page === 'number' &&
    Number.isSafeInteger(input.page) &&
    input.page >= 1
      ? input.page
      : 1;

  return {
    q,
    category,
    material,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page,
  };
}

function appendCanonicalParams(
  params: URLSearchParams,
  state: CatalogQueryState
): void {
  if (state.q !== '') {
    params.set('q', state.q);
  }
  if (state.category !== 'all') {
    params.set('category', state.category);
  }
  if (state.material !== 'all') {
    params.set('material', state.material);
  }
  if (state.minPrice !== null && state.minPrice > 0) {
    params.set('minPrice', String(state.minPrice));
  }
  if (state.maxPrice !== null && state.maxPrice >= 0) {
    params.set('maxPrice', String(state.maxPrice));
  }
  if (state.inStock) {
    params.set('inStock', '1');
  }
  if (state.sort !== 'default') {
    params.set('sort', state.sort);
  }
  if (Number.isSafeInteger(state.page) && state.page > 1) {
    params.set('page', String(state.page));
  }
}

export function buildCatalogHref(input: CatalogQueryInput = {}): string {
  const state = normalizeCatalogQueryInput(input);
  const params = new URLSearchParams();
  appendCanonicalParams(params, state);

  const query = params.toString();
  return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
}

export function updateCatalogQueryState(
  current: CatalogQueryState,
  patch: Partial<CatalogQueryInput>,
  options: { resetPage?: boolean } = {}
): CatalogQueryState {
  const merged: CatalogQueryInput = {
    ...current,
    ...patch,
    page: options.resetPage ? 1 : (patch.page ?? current.page),
  };
  return normalizeCatalogQueryInput(merged);
}

export function getCatalogStateHref(
  current: CatalogQueryState,
  patch: Partial<CatalogQueryInput>,
  options: { resetPage?: boolean } = {}
): string {
  return buildCatalogHref(updateCatalogQueryState(current, patch, options));
}

export function hasActiveCatalogFilters(
  state: Pick<
    CatalogQueryState,
    'q' | 'category' | 'material' | 'minPrice' | 'maxPrice' | 'inStock'
  >
): boolean {
  return (
    state.q !== '' ||
    state.category !== 'all' ||
    state.material !== 'all' ||
    state.minPrice !== null ||
    state.maxPrice !== null ||
    state.inStock
  );
}

export function getCategoryFilterHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter,
  currentState?: Partial<CatalogQueryInput>
): string {
  return buildCatalogHref({ ...currentState, category, material, page: 1 });
}

export function getMaterialFilterHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter,
  currentState?: Partial<CatalogQueryInput>
): string {
  return buildCatalogHref({ ...currentState, category, material, page: 1 });
}

export function getPaginationHref(
  category: CatalogCategoryFilter,
  material: CatalogMaterialFilter,
  page: number,
  currentState?: Partial<CatalogQueryInput>
): string {
  return buildCatalogHref({ ...currentState, category, material, page });
}

/**
 * Builds the searchable plain-text haystack from actual structured product fields:
 * name + SKU + category display name + material display name (+ itemType label if present).
 * Deliberately excludes shortDescription and description to prevent irrelevant hits.
 */
export function getProductSearchHaystack(
  product: CatalogQueryableProduct
): string {
  const parts: string[] = [
    product.name,
    product.sku,
    CATEGORY_NAME_MAP[product.category] ?? '',
    MATERIAL_NAME_MAP[product.material] ?? '',
  ];

  if (product.itemType) {
    parts.push(getItemTypeLabel(product.itemType));
  }

  return normalizeSearchText(parts.join(' '));
}

export function matchesProductSearch(
  product: CatalogQueryableProduct,
  query: string
): boolean {
  const trimmedQuery = normalizeSearchQuery(query);
  if (trimmedQuery === '') {
    return true;
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  if (normalizedQuery === '') {
    return false;
  }

  const words = normalizedQuery.split(' ');
  const haystack = getProductSearchHaystack(product);
  return words.every((word) => haystack.includes(word));
}

function matchesNonCategoryCriteria(
  product: CatalogQueryableProduct,
  normalizedMaterial: CatalogMaterialFilter,
  minPrice: number | null,
  maxPrice: number | null,
  inStock: boolean,
  searchWords: readonly string[] | null
): boolean {
  if (normalizedMaterial !== 'all' && product.material !== normalizedMaterial) {
    return false;
  }
  if (minPrice !== null && product.price < minPrice) {
    return false;
  }
  if (maxPrice !== null && product.price > maxPrice) {
    return false;
  }
  if (inStock && product.stock <= 0) {
    return false;
  }
  if (searchWords !== null) {
    if (searchWords.length === 0) {
      return false;
    }
    const haystack = getProductSearchHaystack(product);
    for (const word of searchWords) {
      if (!haystack.includes(word)) {
        return false;
      }
    }
  }
  return true;
}

function prepareSearchWords(rawQuery: string | undefined): readonly string[] | null {
  const trimmed = normalizeSearchQuery(rawQuery ?? '');
  if (trimmed === '') {
    return null;
  }
  const normalized = normalizeSearchText(trimmed);
  if (normalized === '') {
    return [];
  }
  return normalized.split(' ');
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

export function filterCatalogByCriteria<T extends CatalogQueryableProduct>(
  products: readonly T[],
  criteria: CatalogFilterCriteria
): T[] {
  const category = parseCategoryParam(criteria.category ?? 'all');
  const material = parseMaterialParam(criteria.material ?? 'all');
  const { minPrice, maxPrice } = normalizeProgrammaticPriceBounds(
    criteria.minPrice,
    criteria.maxPrice
  );
  const inStock = Boolean(criteria.inStock);
  const searchWords = prepareSearchWords(criteria.q);

  return products.filter((product) => {
    if (category !== 'all' && product.category !== category) {
      return false;
    }
    return matchesNonCategoryCriteria(
      product,
      material,
      minPrice,
      maxPrice,
      inStock,
      searchWords
    );
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

function countCategories<T extends Pick<Product, 'category'>>(
  products: readonly T[]
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
    counts.all += 1;
    counts[product.category] += 1;
  }

  return counts;
}

export function getCategoryCountsForCriteria<T extends CatalogQueryableProduct>(
  products: readonly T[],
  criteria: Omit<CatalogFilterCriteria, 'category'>
): Record<CatalogCategoryFilter, number> {
  const nonCategoryMatches = filterCatalogByCriteria(products, {
    ...criteria,
    category: 'all',
  });
  return countCategories(nonCategoryMatches);
}

/**
 * Sorts products without mutating the input array, using deterministic source-order tie breaking.
 */
export function sortCatalogProducts<T extends Pick<Product, 'price' | 'name'>>(
  products: readonly T[],
  sort: CatalogSortOption
): T[] {
  if (sort === 'default') {
    return [...products];
  }

  return products
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      let diff = 0;
      if (sort === 'price-asc') {
        diff = a.item.price - b.item.price;
      } else if (sort === 'price-desc') {
        diff = b.item.price - a.item.price;
      } else if (sort === 'name-asc') {
        diff = VI_NAME_COLLATOR.compare(a.item.name, b.item.name);
      }
      return diff !== 0 ? diff : a.index - b.index;
    })
    .map((entry) => entry.item);
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

export function resolveCatalogState<T extends CatalogQueryableProduct>(
  products: readonly T[],
  input: CatalogSearchParamsInput,
  pageSize = CATALOG_PAGE_SIZE
): ResolvedCatalogState<T> {
  const entries = toEntries(input);
  const rawQueries: string[] = [];
  const rawCategories: string[] = [];
  const rawMaterials: string[] = [];
  const rawMinPrices: string[] = [];
  const rawMaxPrices: string[] = [];
  const rawInStocks: string[] = [];
  const rawSorts: string[] = [];
  const rawPages: string[] = [];
  const preservedExtraEntries: Array<[string, string]> = [];

  for (const [key, value] of entries) {
    if (key === 'q') {
      rawQueries.push(value);
    } else if (key === 'category') {
      rawCategories.push(value);
    } else if (key === 'material') {
      rawMaterials.push(value);
    } else if (key === 'minPrice') {
      rawMinPrices.push(value);
    } else if (key === 'maxPrice') {
      rawMaxPrices.push(value);
    } else if (key === 'inStock') {
      rawInStocks.push(value);
    } else if (key === 'sort') {
      rawSorts.push(value);
    } else if (key === 'page') {
      rawPages.push(value);
    } else if (!MANAGED_QUERY_KEYS.has(key)) {
      preservedExtraEntries.push([key, value]);
    }
  }

  const q = parseQueryParam(rawQueries);
  const category = parseCategoryParam(rawCategories);
  const material = parseMaterialParam(rawMaterials);
  const { minPrice, maxPrice } = parseCatalogPriceRange(
    rawMinPrices,
    rawMaxPrices
  );
  const inStock = parseInStockParam(rawInStocks);
  const sort = parseSortParam(rawSorts);
  const requestedPage = parsePageParam(rawPages);

  // Pipeline:
  // 1. Search + all non-category criteria -> coherent category facet counts
  const searchWords = prepareSearchWords(q);
  const nonCategoryMatches = products.filter((product) =>
    matchesNonCategoryCriteria(
      product,
      material,
      minPrice,
      maxPrice,
      inStock,
      searchWords
    )
  );
  const categoryCounts = countCategories(nonCategoryMatches);

  // 2. Apply selected category
  const categoryMatches =
    category === 'all'
      ? nonCategoryMatches
      : nonCategoryMatches.filter((product) => product.category === category);

  // 3. Stable non-mutating sort
  const sortedProducts = sortCatalogProducts(categoryMatches, sort);

  // 4. Paginate (12/page default)
  const pagination = paginateItems(sortedProducts, requestedPage, pageSize);

  const queryState: CatalogQueryState = {
    q,
    category,
    material,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page: pagination.currentPage,
  };

  const canonicalHref = buildCatalogHref(queryState);

  const normalizedParams = new URLSearchParams();
  appendCanonicalParams(normalizedParams, queryState);
  for (const [extraKey, extraValue] of preservedExtraEntries) {
    normalizedParams.append(extraKey, extraValue);
  }
  const normalizedQuery = normalizedParams.toString();
  const normalizedHref = normalizedQuery
    ? `${CATALOG_PATH}?${normalizedQuery}`
    : CATALOG_PATH;

  const expectedQueries = q === '' ? [] : [q];
  const expectedCategories = category === 'all' ? [] : [category];
  const expectedMaterials = material === 'all' ? [] : [material];
  const expectedMinPrices =
    minPrice !== null && minPrice > 0 ? [String(minPrice)] : [];
  const expectedMaxPrices =
    maxPrice !== null && maxPrice >= 0 ? [String(maxPrice)] : [];
  const expectedInStocks = inStock ? ['1'] : [];
  const expectedSorts = sort === 'default' ? [] : [sort];
  const expectedPages =
    pagination.currentPage <= 1 ? [] : [String(pagination.currentPage)];

  const needsNormalization =
    !sameStringArray(rawQueries, expectedQueries) ||
    !sameStringArray(rawCategories, expectedCategories) ||
    !sameStringArray(rawMaterials, expectedMaterials) ||
    !sameStringArray(rawMinPrices, expectedMinPrices) ||
    !sameStringArray(rawMaxPrices, expectedMaxPrices) ||
    !sameStringArray(rawInStocks, expectedInStocks) ||
    !sameStringArray(rawSorts, expectedSorts) ||
    !sameStringArray(rawPages, expectedPages);

  return {
    queryState,
    q,
    category,
    material,
    minPrice,
    maxPrice,
    inStock,
    sort,
    requestedPage,
    filteredProducts: sortedProducts,
    categoryCounts,
    pagination,
    canonicalHref,
    normalizedHref,
    needsNormalization,
  };
}
