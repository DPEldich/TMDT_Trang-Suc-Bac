'use client';

import { useId, type ChangeEvent } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { MATERIALS } from '../../types/product';
import {
  parseMaterialParam,
  type CatalogMaterialFilter,
} from '../../utils/catalog';
import styles from './MaterialFilter.module.css';

export interface MaterialFilterProps {
  selectedMaterial: CatalogMaterialFilter;
  onSelectMaterial: (material: CatalogMaterialFilter) => void;
  id?: string;
  className?: string;
}

export function MaterialFilter({
  selectedMaterial,
  onSelectMaterial,
  id,
  className,
}: MaterialFilterProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectMaterial(parseMaterialParam(event.target.value));
  };

  return (
    <div className={clsx(styles.wrapper, className)}>
      <label htmlFor={selectId} className={styles.label}>
        Chất liệu
      </label>

      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          value={selectedMaterial}
          onChange={handleChange}
          className={styles.select}
          data-active={selectedMaterial !== 'all' ? 'true' : 'false'}
        >
          <option value="all">Tất cả</option>
          {MATERIALS.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>

        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </div>
    </div>
  );
}
