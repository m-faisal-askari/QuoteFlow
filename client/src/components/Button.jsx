import React from 'react';
import styles from '../styles/button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${styles.btn} ${styles[variant] || styles.primary} ${styles[size] || styles.md} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : Icon ? (
        React.isValidElement(Icon) ? (
          Icon
        ) : (
          <Icon size={iconSize} aria-hidden="true" />
        )
      ) : null}
      {children}
    </button>
  );
}
