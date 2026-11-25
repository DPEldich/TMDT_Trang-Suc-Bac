import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Container.module.css';

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  size?: 'default' | 'narrow' | 'wide';
}

export function Container({
  children,
  className,
  size = 'default',
  ...rest
}: ContainerProps) {
  return (
    <div
      className={clsx(
        styles.container,
        size === 'narrow' && styles.narrow,
        size === 'wide' && styles.wide,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
