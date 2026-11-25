'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { Product } from '../../types/product';
import { useCart } from '../../context/CartContext';
import { Button } from '../UI/Button';
import styles from './AddToCartForm.module.css';

export interface AddToCartFormProps {
  product: Product;
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  const { addItem, getItemQuantity, isHydrated } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const cartQty = isHydrated ? getItemQuantity(product.id) : 0;
  const remainingStock = Math.max(0, product.stock - cartQty);
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = remainingStock <= 0 && !isOutOfStock;
  const effectiveQty =
    remainingStock <= 0 ? 0 : Math.min(Math.max(1, selectedQty), remainingStock);

  const handleDecrement = () => {
    setSelectedQty((prev) => Math.max(1, Math.min(prev, remainingStock) - 1));
  };

  const handleIncrement = () => {
    setSelectedQty((prev) => Math.min(remainingStock, prev + 1));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    if (Number.isNaN(val) || val < 1) {
      setSelectedQty(1);
    } else {
      setSelectedQty(Math.min(remainingStock, val));
    }
  };

  const handleAddToCart = () => {
    if (remainingStock <= 0 || effectiveQty <= 0) return;

    const result = addItem(product, effectiveQty);
    if (result.success) {
      setFeedback({
        type: 'success',
        message: result.message,
      });
      setSelectedQty(1);
    } else {
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.stockRow}>
        <span
          className={styles.stockStatus}
          data-status={isOutOfStock ? 'out' : 'available'}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span>
            {isOutOfStock ? 'Tạm hết hàng' : `Còn ${product.stock} sản phẩm`}
          </span>
        </span>

        {cartQty > 0 && (
          <span className={styles.inCartNote}>
            Đang có {cartQty} trong giỏ hàng
          </span>
        )}
      </div>

      <div className={styles.controlsRow}>
        <div
          className={styles.quantityPicker}
          role="group"
          aria-label="Chọn số lượng sản phẩm"
        >
          <button
            type="button"
            className={styles.qtyButton}
            onClick={handleDecrement}
            disabled={effectiveQty <= 1 || remainingStock <= 0}
            aria-label="Giảm 1 sản phẩm"
          >
            <Minus className={styles.qtyIcon} aria-hidden="true" />
          </button>

          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, remainingStock)}
            value={effectiveQty}
            onChange={handleInputChange}
            disabled={remainingStock <= 0}
            className={styles.qtyInput}
            aria-label="Số lượng cần mua"
          />

          <button
            type="button"
            className={styles.qtyButton}
            onClick={handleIncrement}
            disabled={effectiveQty >= remainingStock || remainingStock <= 0}
            aria-label="Tăng 1 sản phẩm"
          >
            <Plus className={styles.qtyIcon} aria-hidden="true" />
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleAddToCart}
          disabled={remainingStock <= 0}
          className={styles.submitButton}
        >
          <ShoppingBag className={styles.cartIcon} aria-hidden="true" />
          <span>
            {isOutOfStock
              ? 'Tạm hết hàng'
              : isMaxInCart
                ? 'Đã đạt giới hạn tồn kho'
                : 'Thêm vào giỏ hàng'}
          </span>
        </Button>
      </div>

      {feedback && (
        <div
          className={styles.feedbackBanner}
          data-type={feedback.type}
          role="status"
          aria-live="polite"
        >
          <div className={styles.feedbackContent}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className={styles.feedbackIcon} aria-hidden="true" />
            ) : (
              <AlertCircle className={styles.feedbackIcon} aria-hidden="true" />
            )}
            <span className={styles.feedbackMessage}>{feedback.message}</span>
          </div>

          {feedback.type === 'success' && (
            <Link href="/gio-hang" className={styles.viewCartLink}>
              <span>Xem giỏ hàng</span>
              <ChevronRight className={styles.linkChevron} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
