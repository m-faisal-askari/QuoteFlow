import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Mail,
  Phone,
  Building,
  AlertTriangle,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/customers.module.css';

export default function Customers() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/customers?search=${encodeURIComponent(query)}` : '/api/customers';
      const res = await api.get(url);
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.del(`/api/customers/${deleteTarget.id}`);
      showToast('Customer deleted successfully', 'success');
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete customer error:', err);
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Failed to delete customer';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.headerTitle}>Customers</h1>
          <p className={styles.headerSubtitle}>
            Manage your customer contact directory and their documents
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/customers/new')}
        >
          Add Customer
        </Button>
      </div>

      {/* Toolbar / Search */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner fullPage={false} message="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No customers match your search' : 'No customers yet'}
          description={
            searchQuery
              ? 'Try modifying your search query or clear the filter.'
              : 'Add your first customer to quickly prefill quotation and invoice details.'
          }
          action={
            searchQuery ? (
              <Button variant="secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/customers/new')}
              >
                Add Customer
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Company</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Phone</th>
                  <th className={styles.th}>Documents</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const docCount =
                    (c._count?.quotations || 0) + (c._count?.invoices || 0);

                  return (
                    <tr key={c.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={styles.customerName}>{c.name}</span>
                        {c.city && (
                          <span className={styles.customerMeta}>
                            {[c.city, c.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {c.company ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Building size={14} color="#64748b" />
                            <span>{c.company}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {c.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Mail size={14} color="#64748b" />
                            <a
                              href={`mailto:${c.email}`}
                              style={{ color: 'inherit' }}
                            >
                              {c.email}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {c.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Phone size={14} color="#64748b" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.docCountBadge}>
                          <FileText size={12} />
                          {docCount} {docCount === 1 ? 'doc' : 'docs'}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Edit customer"
                            onClick={() => navigate(`/customers/${c.id}/edit`)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Delete customer"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        }
      >
        <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          {(deleteTarget?._count?.quotations > 0 || deleteTarget?._count?.invoices > 0) && (
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#dc2626' }}>
              Note: Customers with linked quotations or invoices cannot be deleted until those documents are removed.
            </span>
          )}
        </p>
      </Modal>
    </div>
  );
}
