import React from 'react';
import styles from '../styles/emptyState.module.css';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className={styles.container}>
      {Icon && (
        <div className={styles.iconWrapper}>
          {React.isValidElement(Icon) ? Icon : <Icon size={28} />}
        </div>
      )}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
