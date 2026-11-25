'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/currency';
import { buildCheckoutUrl } from '../../utils/googleForms';
import { LinkButton } from '../UI/Button';
import styles from './CartView.module.css';

export function CartView() {
  const {
    items,
    totalItems,
    subtotal,
    isHydrated,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!isHydrated) {
    return (
      <div className={styles.skeletonLayout} aria-busy="true" role="status">
        <div className={styles.skeletonColumn}>
          <div className={styles.skeletonBarLg} aria-hidden="true" />
          <div className={styles.skeletonRow} aria-hidden="true" />
          <div className={styles.skeletonRow} aria-hidden="true" />
        </div>
        <div className={styles.skeletonSummary} aria-hidden="true" />
        <span className={styles.srOnly}>Đang tải giỏ hàng...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconCircle}>
          <ShoppingBag className={styles.emptyIcon} aria-hidden="true" />
        </div>
        <h2 className={styles.emptyTitle}>Giỏ hàng đang trống</h2>
        <div className={styles.emptyActions}>
          <LinkButton href="/san-pham" variant="primary" size="lg">
            Xem bộ sưu tập
          </LinkButton>
        </div>
      </div>
    );
  }

  const checkoutConfig = buildCheckoutUrl(items, subtotal);

  return (
    <div className={styles.cartLayout}>
      {/* Left Column: Tidy Item Rows */}
      <section className={styles.itemsColumn} aria-labelledby="cart-items-heading">
        <div className={styles.itemsHeader}>
          <h2 id="cart-items-heading" className={styles.sectionTitle}>
            Sản phẩm đã chọn ({totalItems})
          </h2>
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearCart}
            aria-label="Xóa toàn bộ sản phẩm khỏi giỏ hàng"
          >
            <Trash2 className={styles.clearIcon} aria-hidden="true" />
            <span>Xóa tất cả</span>
          </button>
        </div>

        <div className={styles.itemsList}>
          {items.map(({ product, quantity }) => {
            const itemTotal = product.price * quantity;
            const isMaxStock = quantity >= product.stock;

            return (
              <article key={product.id} className={styles.itemRow}>
                <Link
                  href={`/san-pham/${product.slug}`}
                  className={styles.itemThumbnailLink}
                  aria-label={`Xem chi tiết ${product.name}`}
                >
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    width={300}
                    height={300}
                    sizes="88px"
                    className={styles.itemThumbnail}
                  />
                </Link>

                <div className={styles.itemInfo}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemTitleGroup}>
                      <h3 className={styles.itemName}>
                        <Link
                          href={`/san-pham/${product.slug}`}
                          className={styles.itemLink}
                        >
                          {product.name}
                        </Link>
                      </h3>
                      <p className={styles.itemSubMeta}>
                        <span className={styles.unitPrice}>
                          {formatVND(product.price)} / món
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={styles.stockNotice}>
                          Còn {product.stock} sản phẩm
                        </span>
                      </p>
                    </div>

                    <p className={styles.lineTotalValue}>
                      {formatVND(itemTotal)}
                    </p>
                  </div>

                  <div className={styles.itemActions}>
                    <div
                      className={styles.qtyControls}
                      role="group"
                      aria-label={`Thay đổi số lượng cho ${product.name}`}
                    >
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label={`Giảm 1 ${product.name}`}
                      >
                        <Minus className={styles.qtyIcon} aria-hidden="true" />
                      </button>

                      <span
                        className={styles.qtyValue}
                        aria-label={`Số lượng hiện tại: ${quantity}`}
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={isMaxStock}
                        aria-label={`Tăng 1 ${product.name}`}
                      >
                        <Plus className={styles.qtyIcon} aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeItem(product.id)}
                      aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
                    >
                      <Trash2 className={styles.removeIcon} aria-hidden="true" />
                      <span>Xóa</span>
                    </button>
                  </div>

                  {isMaxStock && (
                    <p className={styles.stockLimitWarn} role="status">
                      Đã đạt giới hạn tồn kho ({product.stock} sản phẩm).
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Right Column: Order Summary & Checkout */}
      <aside className={styles.summaryColumn} aria-labelledby="summary-heading">
        <div className={styles.summaryCard}>
          <h2 id="summary-heading" className={styles.summaryTitle}>
            Tóm tắt đơn hàng
          </h2>

          <dl className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>Tổng số lượng</dt>
              <dd className={styles.summaryValue}>{totalItems} sản phẩm</dd>
            </div>

            <div className={styles.summaryRow}>
              <dt className={styles.summaryLabel}>Tạm tính</dt>
              <dd className={styles.summaryValue}>{formatVND(subtotal)}</dd>
            </div>
          </dl>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng cộng</span>
            <span className={styles.totalValue}>{formatVND(subtotal)}</span>
          </div>

          <div className={styles.checkoutActionGroup}>
            {checkoutConfig.isConfigured && checkoutConfig.targetUrl ? (
              <a
                href={checkoutConfig.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.checkoutAnchor}
                aria-label="Đặt hàng qua biểu mẫu (mở tab mới)"
              >
                <span>Đặt hàng</span>
                <ExternalLink
                  className={styles.externalIcon}
                  aria-hidden="true"
                />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={styles.checkoutAnchorDisabled}
              >
                Đặt hàng
              </button>
            )}

            <p className={styles.checkoutHelper}>
              Cửa hàng sẽ gọi xác nhận đơn hàng.
            </p>

            <Link href="/san-pham" className={styles.continueLink}>
              <span>Tiếp tục xem bộ sưu tập</span>
              <ChevronRight className={styles.chevronIcon} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
