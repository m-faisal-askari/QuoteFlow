import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileCheck,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import styles from '../styles/documents.module.css';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function QuotationList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/quotations');
      setQuotations(res.quotations || []);
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
      showToast('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Tab filter
      if (activeTab !== 'all' && (q.status || '').toLowerCase() !== activeTab) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const num = (q.quoteNumber || '').toLowerCase();
        const custName = (q.customer?.name || q.customerName || '').toLowerCase();
        const custComp = (q.customer?.company || q.customerCompany || '').toLowerCase();
        return num.includes(query) || custName.includes(query) || custComp.includes(query);
      }

      return true;
    });
  }, [quotations, activeTab, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.del(`/api/quotations/${deleteTarget.id}`);
      showToast('Quotation deleted successfully', 'success');
      setQuotations((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete quotation failed:', err);
      showToast(err.message || 'Failed to delete quotation', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async (e, id, quoteNumber) => {
    e.stopPropagation();
    try {
      await api.downloadFile(`/api/pdf/quotation/${id}`, `Quotation-${quoteNumber || id}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/quotations/${id}/status`, { status: newStatus });
      setQuotations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast(`Status updated to "${newStatus}"`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Quotations</h1>
          <p className={styles.headerSubtitle}>
            Create, manage, and track client quotations and cost estimates
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/quotations/new')}
        >
          New Quotation
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'all'
                ? ` (${quotations.length})`
                : ` (${quotations.filter((q) => (q.status || '').toLowerCase() === tab.id).length})`}
            </button>
          ))}
        </div>

        <div className={styles.filterControls}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by quote # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner fullPage={false} message="Loading quotations..." />
      ) : filteredQuotations.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={searchQuery || activeTab !== 'all' ? 'No quotations match your filters' : 'No quotations yet'}
          description={
            searchQuery || activeTab !== 'all'
              ? 'Try selecting a different filter tab or clearing your search query.'
              : 'Create your first professional quotation to send to prospective clients.'
          }
          action={
            searchQuery || activeTab !== 'all' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/quotations/new')}
              >
                Create Quotation
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
                  <th className={styles.th}>Quote #</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Issue Date</th>
                  <th className={styles.th}>Expiry Date</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => {
                  const custName = q.customer?.name || q.customerName || '—';
                  const custComp = q.customer?.company || q.customerCompany;

                  return (
                    <tr
                      key={q.id}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/quotations/${q.id}`)}
                    >
                      <td className={styles.td}>
                        <span className={styles.docNumber}>{q.quoteNumber}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.customerName}>{custName}</div>
                        {custComp && (
                          <div className={styles.customerCompany}>{custComp}</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{formatCurrency(q.total, q.currency)}</strong>
                      </td>
                      <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                        <select
                          className={styles.statusSelectInline}
                          value={q.status || 'draft'}
                          onChange={(e) => handleStatusChange(e, q.id, e.target.value)}
                          title="Change quotation status"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>
                      <td className={styles.td}>{formatDate(q.issueDate || q.createdAt)}</td>
                      <td className={styles.td}>{formatDate(q.expiryDate) || '—'}</td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div
                          className={styles.actionsCell}
                          style={{ justifyContent: 'flex-end' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Download PDF"
                            onClick={(e) => handleDownloadPdf(e, q.id, q.quoteNumber)}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Edit Quotation"
                            onClick={() => navigate(`/quotations/${q.id}`)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Delete Quotation"
                            onClick={() => setDeleteTarget(q)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quotation"
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
              {deleting ? 'Deleting...' : 'Delete Quotation'}
            </Button>
          </div>
        }
      >
        <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete quotation{' '}
          <strong>{deleteTarget?.quoteNumber}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
