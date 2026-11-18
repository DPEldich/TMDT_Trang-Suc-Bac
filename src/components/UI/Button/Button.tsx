import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export type ButtonProps = BaseButtonProps &
  ComponentPropsWithoutRef<'button'> & {
    href?: undefined;
  };

export type LinkButtonProps = BaseButtonProps &
  ComponentPropsWithoutRef<typeof Link> & {
    href: string;
  };

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    disabled,
    type = 'button',
    ...rest
  } = props;

  return (
    <button
      type={type}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton(props: LinkButtonProps) {
  const {
    children,
    href,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    ...rest
  } = props;

  return (
    <Link
      href={href}
      data-variant={variant}
      data-size={size}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
