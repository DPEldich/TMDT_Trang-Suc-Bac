'use client';

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import {
  CATALOG_QUERY_MAX_LENGTH,
  normalizeSearchQuery,
} from '../../utils/catalog';
import styles from './CatalogSearch.module.css';

export interface CatalogSearchProps {
  committedQuery: string;
  syncKey: string;
  onSubmitQuery: (query: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  variant?: 'default' | 'morph';
  className?: string;
}

export function CatalogSearch({
  committedQuery,
  syncKey,
  onSubmitQuery,
  inputRef,
  variant = 'default',
  className,
}: CatalogSearchProps) {
  const inputId = useId();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? internalInputRef;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [draftValue, setDraftValue] = useState(committedQuery);

  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setDraftValue(committedQuery);
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftValue(event.target.value);
  };

  const handleClearDraft = () => {
    setDraftValue('');
    resolvedInputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeSearchQuery(draftValue);
    setDraftValue(normalized);
    onSubmitQuery(normalized);
  };

  const showLeadingIcon = variant !== 'morph';

  return (
    <form
      role="search"
      data-variant={variant}
      className={clsx(styles.form, className)}
      onSubmit={handleSubmit}
    >
      <label htmlFor={inputId} className={styles.srOnly}>
        Tìm tên hoặc mã sản phẩm
      </label>

      <div className={styles.inputGroup}>
        {showLeadingIcon && (
          <Search className={styles.searchIcon} aria-hidden="true" />
        )}
        <input
          ref={resolvedInputRef}
          id={inputId}
          name="q"
          type="search"
          value={draftValue}
          onChange={handleChange}
          maxLength={CATALOG_QUERY_MAX_LENGTH}
          placeholder="Tìm tên hoặc mã sản phẩm"
          autoComplete="off"
          enterKeyHint="search"
          className={clsx(
            styles.input,
            !showLeadingIcon && styles.inputWithoutLeadingIcon,
            draftValue.length > 0 && styles.inputWithClear
          )}
        />
        {draftValue.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearDraft}
            aria-label="Xóa từ khóa đang nhập"
          >
            <X className={styles.clearIcon} aria-hidden="true" />
          </button>
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        Tìm kiếm
      </button>
    </form>
  );
}
