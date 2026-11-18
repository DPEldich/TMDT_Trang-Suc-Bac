'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const cartQty = isHydrated ? getItemQuantity(product.id) : 0;
  const remainingStock = Math.max(0, product.stock - cartQty);
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = remainingStock <= 0 && !isOutOfStock;

  const handleDecrement = () => {
    setSelectedQty((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setSelectedQty((prev) => Math.min(remainingStock, prev + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setSelectedQty(1);
    } else {
      setSelectedQty(Math.min(remainingStock, val));
    }
  };

  const handleAddToCart = () => {
    if (remainingStock <= 0) return;

    const result = addItem(product, selectedQty);
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
      {/* Inventory & Cart context info */}
      <div className={styles.stockNotice}>
        <div className={styles.stockStatus}>
          <span className={styles.statusDot} data-status={isOutOfStock ? 'out' : 'available'} />
          <span className={styles.statusText}>
            {isOutOfStock
              ? 'Tạm hết hàng'
              : `Còn ${product.stock} sản phẩm`}
          </span>
        </div>
        {cartQty > 0 && (
          <span className={styles.inCartBadge}>
            Đang có {cartQty} món trong giỏ
          </span>
        )}
      </div>

      {/* Quantity & CTA */}
      <div className={styles.controlsRow}>
        <div className={styles.quantityPicker} role="group" aria-label="Chọn số lượng sản phẩm">
          <button
            type="button"
            className={styles.qtyButton}
            onClick={handleDecrement}
            disabled={selectedQty <= 1 || remainingStock <= 0}
            aria-label="Giảm số lượng 1 sản phẩm"
          >
            <Minus className={styles.qtyIcon} aria-hidden="true" />
          </button>

          <input
            type="number"
            min={1}
            max={Math.max(1, remainingStock)}
            value={remainingStock <= 0 ? 0 : selectedQty}
            onChange={handleInputChange}
            disabled={remainingStock <= 0}
            className={styles.qtyInput}
            aria-label="Số lượng cần mua"
          />

          <button
            type="button"
            className={styles.qtyButton}
            onClick={handleIncrement}
            disabled={selectedQty >= remainingStock || remainingStock <= 0}
            aria-label="Tăng số lượng 1 sản phẩm"
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

      {/* Immediate Visible Feedback */}
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
              Xem giỏ hàng →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
