import type { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isHydrated: boolean;
  addItem: (product: Product, quantity?: number) => { success: boolean; message: string; addedQty: number };
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}
