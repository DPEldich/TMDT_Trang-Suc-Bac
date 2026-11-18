import type { CartItem } from '../types/cart';
import { formatVND } from './currency';

export const DEFAULT_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfAddymrcJd_pTVvYxwSR_eEG5hx5zOWTUksHGdEQ_XpibVng/viewform';
export const DEFAULT_GOOGLE_FORM_ORDER_ENTRY_ID = '1879177736';

export interface GoogleFormConfigResult {
  isConfigured: boolean;
  targetUrl: string | null;
}

/**
 * Validates strictly:
 * - HTTPS docs.google.com
 * - /forms/d/e/<id>/viewform (or legacy /forms/d/<id>/viewform)
 * - Disallow credentials (username / password)
 * - Disallow custom ports
 */
export function validateGoogleFormUrl(rawUrl: string): { isValid: boolean; parsed?: URL } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false };
  }

  if (parsed.protocol !== 'https:') {
    return { isValid: false };
  }

  if (parsed.hostname !== 'docs.google.com') {
    return { isValid: false };
  }

  // Disallow credentials
  if (parsed.username !== '' || parsed.password !== '') {
    return { isValid: false };
  }

  // Disallow custom port
  if (parsed.port !== '' && parsed.port !== '443') {
    return { isValid: false };
  }

  // Strictly match /forms/d/e/<id>/viewform or /forms/d/<id>/viewform
  const pathRegex = /^\/forms\/d\/(?:e\/)?[a-zA-Z0-9_-]+\/viewform$/;
  if (!pathRegex.test(parsed.pathname)) {
    return { isValid: false };
  }

  return { isValid: true, parsed };
}

/**
 * Builds a single-line order summary.
 * Format: [SKU] Tên sản phẩm xSố lượng, ... | Tạm tính: ...
 * No timestamps, no banners, exactly one line.
 */
export function buildOrderSummary(items: CartItem[], subtotal: number): string {
  const itemParts = items.map(
    (item) => `[${item.product.sku}] ${item.product.name} x${item.quantity}`
  );
  return `${itemParts.join(', ')} | Tạm tính: ${formatVND(subtotal)}`;
}

/**
 * Builds the prefilled Google Form responder URL.
 * Uses environment variable overrides if BOTH are provided, otherwise defaults
 * to the verified checked-in public form and entry ID.
 */
export function buildCheckoutUrl(items: CartItem[], subtotal: number): GoogleFormConfigResult {
  if (items.length === 0) {
    return { isConfigured: false, targetUrl: null };
  }

  const envUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL?.trim();
  const envEntryId = process.env.NEXT_PUBLIC_GOOGLE_FORM_ORDER_ENTRY_ID?.trim();

  // If both paired env variables are provided, use them; otherwise use checked-in defaults
  const formUrl = envUrl && envEntryId ? envUrl : DEFAULT_GOOGLE_FORM_URL;
  const entryIdRaw = envUrl && envEntryId ? envEntryId : DEFAULT_GOOGLE_FORM_ORDER_ENTRY_ID;

  const urlValidation = validateGoogleFormUrl(formUrl);
  if (!urlValidation.isValid || !urlValidation.parsed) {
    return { isConfigured: false, targetUrl: null };
  }

  const cleanEntryId = entryIdRaw.replace(/^entry\./, '');
  if (!cleanEntryId || !/^[0-9]+$/.test(cleanEntryId)) {
    return { isConfigured: false, targetUrl: null };
  }

  const summary = buildOrderSummary(items, subtotal);

  // Clear existing search and hash
  const parsed = urlValidation.parsed;
  parsed.search = '';
  parsed.hash = '';

  parsed.searchParams.set('usp', 'pp_url');
  parsed.searchParams.set(`entry.${cleanEntryId}`, summary);

  return {
    isConfigured: true,
    targetUrl: parsed.toString(),
  };
}
