import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Container.module.css';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}

export function Container({ children, className, size = 'default' }: ContainerProps) {
  return (
    <div
      className={clsx(
        styles.container,
        size === 'narrow' && styles.narrow,
        size === 'wide' && styles.wide,
        className
      )}
    >
      {children}
    </div>
  );
}
