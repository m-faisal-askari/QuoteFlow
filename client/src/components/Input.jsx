import React, { forwardRef } from 'react';
import styles from '../styles/input.module.css';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    type = 'text',
    required = false,
    className = '',
    id,
    ...rest
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputGroup}>
        {Icon && (
          <span className={styles.iconWrapper} aria-hidden="true">
            {React.isValidElement(Icon) ? Icon : <Icon size={16} />}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`${styles.input} ${Icon ? styles.hasIcon : ''} ${error ? styles.inputError : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          {...rest}
        />
      </div>

      {error ? (
        <span className={styles.errorMessage} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </div>
  );
});

export default Input;
