/**
 * Formats an integer VND amount to Vietnamese currency string (e.g. 480.000 ₫).
 */
export function formatVND(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}
