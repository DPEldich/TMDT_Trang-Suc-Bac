'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ExternalLink } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/currency';
import { buildCheckoutUrl } from '../../utils/googleForms';
import { LinkButton } from '../UI/Button';
import styles from './CartView.module.css';

export function CartView() {
  const { items, totalItems, subtotal, isHydrated, updateQuantity, removeItem, clearCart } = useCart();

  if (!isHydrated) {
    return (
      <div className={styles.loadingWrapper} aria-busy="true">
        <p className={styles.loadingText}>Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconCircle}>
          <ShoppingBag className={styles.emptyIcon} aria-hidden="true" />
        </div>
        <h2 className={styles.emptyTitle}>Giỏ hàng của bạn đang trống</h2>
        <p className={styles.emptyDesc}>
          Hiện tại bạn chưa chọn món trang sức nào.
        </p>
        <div className={styles.emptyActions}>
          <LinkButton href="/san-pham" variant="primary" size="lg">
            Xem sản phẩm
          </LinkButton>
        </div>
      </div>
    );
  }

  const checkoutConfig = buildCheckoutUrl(items, subtotal);

  return (
    <div className={styles.cartLayout}>
      {/* Left Column: Items List */}
      <div className={styles.itemsColumn}>
        <div className={styles.itemsHeader}>
          <h2 className={styles.sectionTitle}>
            Danh sách món hàng ({totalItems})
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
              <div key={product.id} className={styles.itemRow}>
                <div className={styles.itemThumbnailWrapper}>
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    width={100}
                    height={100}
                    className={styles.itemThumbnail}
                  />
                </div>

                <div className={styles.itemInfo}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemTitleGroup}>
                      <span className={styles.itemSku}>{product.sku}</span>
                      <h3 className={styles.itemName}>
                        <Link href={`/san-pham/${product.slug}`} className={styles.itemLink}>
                          {product.name}
                        </Link>
                      </h3>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeItem(product.id)}
                      aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
                    >
                      <Trash2 className={styles.removeIcon} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.itemMeta}>
                    <span className={styles.unitPrice}>
                      Đơn giá: {formatVND(product.price)}
                    </span>
                    <span className={styles.stockNotice}>
                      (Kho còn {product.stock})
                    </span>
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
                        aria-label="Giảm 1 sản phẩm"
                      >
                        <Minus className={styles.qtyIcon} aria-hidden="true" />
                      </button>

                      <span className={styles.qtyValue} aria-label={`Số lượng: ${quantity}`}>
                        {quantity}
                      </span>

                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={isMaxStock}
                        aria-label="Tăng 1 sản phẩm"
                      >
                        <Plus className={styles.qtyIcon} aria-hidden="true" />
                      </button>
                    </div>

                    <div className={styles.lineTotalWrapper}>
                      <span className={styles.lineTotalLabel}>Thành tiền:</span>
                      <span className={styles.lineTotalValue}>{formatVND(itemTotal)}</span>
                    </div>
                  </div>

                  {isMaxStock && (
                    <p className={styles.stockLimitWarn}>
                      Đã đạt giới hạn tồn kho ({product.stock} sản phẩm).
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Order Summary & Checkout */}
      <div className={styles.summaryColumn}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tổng số lượng</span>
              <span className={styles.summaryValue}>{totalItems} món</span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tạm tính</span>
              <span className={styles.summaryValue}>{formatVND(subtotal)}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Tổng cộng</span>
              <span className={styles.totalValue}>{formatVND(subtotal)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <div className={styles.checkoutActionGroup}>
            {checkoutConfig.isConfigured && checkoutConfig.targetUrl ? (
              <a
                href={checkoutConfig.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.checkoutAnchor}
              >
                <span>Tiến hành thanh toán</span>
                <ExternalLink className={styles.externalIcon} aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={styles.checkoutAnchorDisabled}
              >
                Tiến hành thanh toán
              </button>
            )}

            <p className={styles.checkoutHelper}>
              Sau khi gửi biểu mẫu, shop sẽ gọi điện thoại xác nhận đơn hàng trước khi giao.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
