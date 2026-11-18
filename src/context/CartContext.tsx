'use client';

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { CartContextValue, CartItem, StoredCartItem } from '../types/cart';
import type { Product } from '../types/product';
import { getProductById } from '../data/products';

const CART_STORAGE_KEY = 'nfa_cart_v1';
const CART_CHANGE_EVENT = 'nfa-cart-change';

const CartContext = createContext<CartContextValue | null>(null);

// In-memory cache to guarantee that storage access errors do not wipe the cart
// and that consecutive actions always read the freshest snapshot.
let memoryStorageCache = '[]';
let hasUnsavedCart = false;

/**
 * Validates and normalizes untrusted stored cart data from localStorage.
 * - Rejects non-integer, non-number quantities without casts
 * - Rejects untrusted shapes
 * - Merges duplicate product IDs
 * - Caps totals at available stock
 */
function sanitizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  // Map to merge duplicate product IDs and aggregate quantities safely
  const aggregated = new Map<string, number>();

  for (const value of raw) {
    const entry: unknown = value;
    if (typeof entry !== 'object' || entry === null || !('productId' in entry) || !('quantity' in entry)) continue;
    const { productId, quantity } = entry;

    // Strict validation: productId must be a non-empty string
    if (typeof productId !== 'string' || productId.trim() === '') continue;

    // Strict validation: quantity must be a genuine positive integer number
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) continue;

    const current = aggregated.get(productId) ?? 0;
    aggregated.set(productId, current + quantity);
  }

  const validatedItems: CartItem[] = [];

  for (const [productId, totalQty] of aggregated.entries()) {
    const product = getProductById(productId);
    if (!product || product.stock <= 0) continue;

    // Cap total at available product stock
    const finalQty = Math.min(totalQty, product.stock);
    if (finalQty > 0) {
      validatedItems.push({
        product,
        quantity: finalQty,
      });
    }
  }

  return validatedItems;
}

function subscribeToStorage(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(CART_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(CART_CHANGE_EVENT, handler);
  };
}

function getStoredSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  if (hasUnsavedCart) return memoryStorageCache;

  try {
    memoryStorageCache = window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]';
  } catch {
    // Preserve the last cart when browser storage is temporarily unavailable.
  }
  return memoryStorageCache;
}

function getServerSnapshot(): string {
  return '[]';
}

function getClientHydratedSnapshot(): boolean {
  return true;
}

function getServerHydratedSnapshot(): boolean {
  return false;
}

function persistLightweightItems(stored: StoredCartItem[]) {
  const jsonString = JSON.stringify(stored);
  memoryStorageCache = jsonString;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, jsonString);
      hasUnsavedCart = false;
    } catch {
      hasUnsavedCart = true;
    }
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  }
}

function getFreshLightweightItems(): StoredCartItem[] {
  const raw = getStoredSnapshot();
  try {
    const parsed: unknown = JSON.parse(raw);
    const sanitized = sanitizeStoredCart(parsed);
    return sanitized.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity,
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const rawCart = useSyncExternalStore(subscribeToStorage, getStoredSnapshot, getServerSnapshot);
  const isHydrated = useSyncExternalStore(
    subscribeToStorage,
    getClientHydratedSnapshot,
    getServerHydratedSnapshot
  );

  const items = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(rawCart);
      return sanitizeStoredCart(parsed);
    } catch {
      return [];
    }
  }, [rawCart]);

  const getItemQuantity = useCallback(
    (productId: string): number => {
      if (typeof productId !== 'string') return 0;
      const found = items.find((it) => it.product.id === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const addItem = useCallback(
    (product: Product, quantity = 1): { success: boolean; message: string; addedQty: number } => {
      // Validate inputs strictly
      if (!product || typeof product.id !== 'string') {
        return { success: false, message: 'Sản phẩm không hợp lệ.', addedQty: 0 };
      }
      if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, message: 'Số lượng thêm phải là số nguyên dương.', addedQty: 0 };
      }

      // Always read the freshest snapshot for consecutive actions
      const freshItems = getFreshLightweightItems();
      const currentEntry = freshItems.find((it) => it.productId === product.id);
      const currentQty = currentEntry ? currentEntry.quantity : 0;
      const remainingStock = Math.max(0, product.stock - currentQty);

      if (remainingStock <= 0) {
        return {
          success: false,
          message: `Số lượng trong giỏ đã đạt giới hạn tồn kho (${product.stock} sản phẩm).`,
          addedQty: 0,
        };
      }

      const qtyToAdd = Math.min(quantity, remainingStock);
      let updated: StoredCartItem[];

      if (currentEntry) {
        updated = freshItems.map((it) => {
          if (it.productId === product.id) {
            return { productId: it.productId, quantity: Math.min(it.quantity + qtyToAdd, product.stock) };
          }
          return it;
        });
      } else {
        updated = [...freshItems, { productId: product.id, quantity: qtyToAdd }];
      }

      persistLightweightItems(updated);

      const message =
        qtyToAdd < quantity
          ? `Đã thêm ${qtyToAdd} sản phẩm vào giỏ (đạt mức tồn kho: ${product.stock}).`
          : `Đã thêm ${qtyToAdd} sản phẩm vào giỏ hàng.`;

      return { success: true, message, addedQty: qtyToAdd };
    },
    []
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (typeof productId !== 'string') return;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) return;

    const freshItems = getFreshLightweightItems();
    let updated: StoredCartItem[];

    if (quantity <= 0) {
      updated = freshItems.filter((it) => it.productId !== productId);
    } else {
      updated = freshItems
        .map((it) => {
          if (it.productId === productId) {
            const product = getProductById(productId);
            const maxStock = product ? product.stock : quantity;
            const clamped = Math.min(quantity, maxStock);
            return clamped > 0 ? { productId: it.productId, quantity: clamped } : null;
          }
          return it;
        })
        .filter((it): it is StoredCartItem => it !== null);
    }

    persistLightweightItems(updated);
  }, []);

  const removeItem = useCallback((productId: string) => {
    if (typeof productId !== 'string') return;
    const freshItems = getFreshLightweightItems();
    const updated = freshItems.filter((it) => it.productId !== productId);
    persistLightweightItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    persistLightweightItems([]);
  }, []);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemQuantity,
    }),
    [items, totalItems, subtotal, isHydrated, addItem, updateQuantity, removeItem, clearCart, getItemQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
