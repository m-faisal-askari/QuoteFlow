import React from 'react';
import styles from '../styles/statusBadge.module.css';

const STATUS_CONFIGS = {
  quotation: {
    draft: { color: 'gray', label: 'Draft' },
    sent: { color: 'blue', label: 'Sent' },
    accepted: { color: 'green', label: 'Accepted' },
    rejected: { color: 'red', label: 'Rejected' },
    expired: { color: 'orange', label: 'Expired' },
    converted: { color: 'purple', label: 'Converted' },
  },
  invoice: {
    draft: { color: 'gray', label: 'Draft' },
    sent: { color: 'blue', label: 'Sent' },
    unpaid: { color: 'orange', label: 'Unpaid' },
    partially_paid: { color: 'yellow', label: 'Partially Paid' },
    paid: { color: 'green', label: 'Paid' },
    overdue: { color: 'red', label: 'Overdue' },
    cancelled: { color: 'gray', label: 'Cancelled' },
  },
};

export default function StatusBadge({ status = 'draft', type = 'quotation' }) {
  const normalizedStatus = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const typeConfig = STATUS_CONFIGS[type] || STATUS_CONFIGS.quotation;
  const config = typeConfig[normalizedStatus] || {
    color: 'gray',
    label: normalizedStatus.replace(/_/g, ' '),
  };

  const colorClass = styles[config.color] || styles.gray;

  return (
    <span className={`${styles.badge} ${colorClass}`}>
      <span className={styles.dot} />
      {config.label}
    </span>
  );
}
