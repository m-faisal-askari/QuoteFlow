import React from 'react';
import styles from '../styles/spinner.module.css';

export default function LoadingSpinner({ size = 'md', fullPage = false, message }) {
  const content = (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <div className={`${styles.spinner} ${styles[size] || styles.md}`} />
      {message && <span>{message}</span>}
    </div>
  );

  return content;
}
