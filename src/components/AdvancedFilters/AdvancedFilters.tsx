'use client';

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import clsx from 'clsx';
import { validatePriceRangeInputs } from '../../utils/catalog';
import styles from './AdvancedFilters.module.css';

export interface AdvancedFiltersApplyPayload {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
}

export interface AdvancedFiltersProps {
  id: string;
  syncKey: string;
  committedMinPrice: number | null;
  committedMaxPrice: number | null;
  committedInStock: boolean;
  onApply: (next: AdvancedFiltersApplyPayload) => void;
  className?: string;
}

interface AdvancedDraftState {
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  minError: string | null;
  maxError: string | null;
}

function buildCommittedDraft(
  committedMinPrice: number | null,
  committedMaxPrice: number | null,
  committedInStock: boolean
): AdvancedDraftState {
  return {
    minPrice: committedMinPrice === null ? '' : String(committedMinPrice),
    maxPrice: committedMaxPrice === null ? '' : String(committedMaxPrice),
    inStock: committedInStock,
    minError: null,
    maxError: null,
  };
}

export function AdvancedFilters({
  id,
  syncKey,
  committedMinPrice,
  committedMaxPrice,
  committedInStock,
  onApply,
  className,
}: AdvancedFiltersProps) {
  const minPriceId = useId();
  const maxPriceId = useId();
  const minErrorId = useId();
  const maxErrorId = useId();
  const inStockId = useId();

  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [draft, setDraft] = useState<AdvancedDraftState>(() =>
    buildCommittedDraft(committedMinPrice, committedMaxPrice, committedInStock)
  );

  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setDraft(
      buildCommittedDraft(
        committedMinPrice,
        committedMaxPrice,
        committedInStock
      )
    );
  }

  const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({
      ...prev,
      minPrice: event.target.value,
      minError: null,
    }));
  };

  const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({
      ...prev,
      maxPrice: event.target.value,
      maxError: null,
      minError:
        prev.minError === 'Giá từ không được lớn hơn Giá đến.'
          ? null
          : prev.minError,
    }));
  };

  const handleInStockChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setDraft((prev) => ({
      ...prev,
      inStock: checked,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePriceRangeInputs(draft.minPrice, draft.maxPrice);

    if (!validation.valid) {
      setDraft((prev) => ({
        ...prev,
        minError: validation.minError,
        maxError: validation.maxError,
      }));

      if (validation.firstInvalidField === 'maxPrice') {
        maxInputRef.current?.focus();
      } else {
        minInputRef.current?.focus();
      }
      return;
    }

    setDraft({
      minPrice: validation.minPrice === null ? '' : String(validation.minPrice),
      maxPrice: validation.maxPrice === null ? '' : String(validation.maxPrice),
      inStock: draft.inStock,
      minError: null,
      maxError: null,
    });

    onApply({
      minPrice: validation.minPrice,
      maxPrice: validation.maxPrice,
      inStock: draft.inStock,
    });
  };

  return (
    <form
      id={id}
      className={clsx(styles.panel, className)}
      aria-label="Bộ lọc nâng cao"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={styles.grid}>
        <div className={styles.priceFields}>
          <div className={styles.field}>
            <label htmlFor={minPriceId} className={styles.fieldLabel}>
              Giá từ
            </label>
            <div
              className={styles.priceInputWrap}
              data-invalid={draft.minError ? 'true' : 'false'}
            >
              <input
                ref={minInputRef}
                id={minPriceId}
                name="minPrice"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={draft.minPrice}
                onChange={handleMinChange}
                aria-invalid={draft.minError ? true : undefined}
                aria-describedby={draft.minError ? minErrorId : undefined}
                className={styles.priceInput}
              />
              <span className={styles.currencyUnit} aria-hidden="true">
                VNĐ
              </span>
            </div>
            {draft.minError && (
              <p id={minErrorId} className={styles.fieldError}>
                {draft.minError}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={maxPriceId} className={styles.fieldLabel}>
              Giá đến
            </label>
            <div
              className={styles.priceInputWrap}
              data-invalid={draft.maxError ? 'true' : 'false'}
            >
              <input
                ref={maxInputRef}
                id={maxPriceId}
                name="maxPrice"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Không giới hạn"
                value={draft.maxPrice}
                onChange={handleMaxChange}
                aria-invalid={draft.maxError ? true : undefined}
                aria-describedby={draft.maxError ? maxErrorId : undefined}
                className={styles.priceInput}
              />
              <span className={styles.currencyUnit} aria-hidden="true">
                VNĐ
              </span>
            </div>
            {draft.maxError && (
              <p id={maxErrorId} className={styles.fieldError}>
                {draft.maxError}
              </p>
            )}
          </div>
        </div>

        <div className={styles.actionsRow}>
          <label htmlFor={inStockId} className={styles.checkboxLabel}>
            <input
              id={inStockId}
              name="inStock"
              type="checkbox"
              checked={draft.inStock}
              onChange={handleInStockChange}
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxText}>
              Chỉ hiện sản phẩm còn hàng
            </span>
          </label>

          <button type="submit" className={styles.applyButton}>
            Áp dụng
          </button>
        </div>
      </div>
    </form>
  );
}
