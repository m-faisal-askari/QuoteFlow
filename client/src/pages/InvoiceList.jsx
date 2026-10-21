import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  CreditCard,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatInputDate } from '../utils/formatters';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Input from '../components/Input';
import styles from '../styles/documents.module.css';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partially_paid', label: 'Partially Paid' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Credit Card',
  'Cash',
  'Check',
  'PayPal',
  'Stripe',
  'Other',
];

export default function InvoiceList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Record Payment modal state
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: formatInputDate(new Date()),
    method: 'Bank Transfer',
    reference: '',
    notes: '',
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/invoices');
      setInvoices(res.invoices || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      // Tab filter
      if (activeTab !== 'all') {
        const isActuallyOverdue =
          inv.status === 'overdue' ||
          (inv.dueDate && new Date(inv.dueDate) < now && inv.balanceDue > 0 && inv.status !== 'paid');

        if (activeTab === 'overdue') {
          if (!isActuallyOverdue) return false;
        } else if ((inv.status || '').toLowerCase() !== activeTab) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        const custName = (inv.customer?.name || inv.customerName || '').toLowerCase();
        const custComp = (inv.customer?.company || inv.customerCompany || '').toLowerCase();
        return num.includes(query) || custName.includes(query) || custComp.includes(query);
      }

      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.del(`/api/invoices/${deleteTarget.id}`);
      showToast('Invoice deleted successfully', 'success');
      setInvoices((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete invoice failed:', err);
      showToast(err.message || 'Failed to delete invoice', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenPayment = (e, inv) => {
    e.stopPropagation();
    setPaymentTarget(inv);
    setPaymentData({
      amount: inv.balanceDue > 0 ? String(inv.balanceDue) : '',
      date: formatInputDate(new Date()),
      method: 'Bank Transfer',
      reference: '',
      notes: '',
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const numAmount = parseFloat(paymentData.amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid payment amount greater than zero.', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      await api.post(`/api/invoices/${paymentTarget.id}/payments`, {
        amount: numAmount,
        date: new Date(paymentData.date).toISOString(),
        method: paymentData.method,
        reference: paymentData.reference.trim(),
        notes: paymentData.notes.trim(),
      });

      showToast(`Payment of ${formatCurrency(numAmount, paymentTarget.currency)} recorded!`, 'success');
      setPaymentTarget(null);
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to record payment:', err);
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Failed to record payment';
      showToast(msg, 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDownloadPdf = async (e, id, invoiceNumber) => {
    e.stopPropagation();
    try {
      await api.downloadFile(`/api/pdf/invoice/${id}`, `Invoice-${invoiceNumber || id}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/invoices/${id}/status`, { status: newStatus });
      setInvoices((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast(`Status updated to "${newStatus}"`, 'success');
    } catch (err) {
      console.error('Failed to update invoice status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Invoices</h1>
          <p className={styles.headerSubtitle}>
            Bill customers, track payment balances, and record incoming settlements
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/invoices/new')}
        >
          New Invoice
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? invoices.length
                : tab.id === 'overdue'
                ? invoices.filter(
                    (i) =>
                      i.status === 'overdue' ||
                      (i.dueDate && new Date(i.dueDate) < new Date() && i.balanceDue > 0 && i.status !== 'paid')
                  ).length
                : invoices.filter((i) => (i.status || '').toLowerCase() === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className={styles.filterControls}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by invoice # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner fullPage={false} message="Loading invoices..." />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={searchQuery || activeTab !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}
          description={
            searchQuery || activeTab !== 'all'
              ? 'Try selecting a different filter tab or clearing your search query.'
              : 'Create your first invoice to bill customers and manage receivables.'
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
                onClick={() => navigate('/invoices/new')}
              >
                Create Invoice
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
                  <th className={styles.th}>Invoice #</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Paid</th>
                  <th className={styles.th}>Balance</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Due Date</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const custName = inv.customer?.name || inv.customerName || '—';
                  const custComp = inv.customer?.company || inv.customerCompany;
                  const isOverdue =
                    inv.balanceDue > 0 &&
                    inv.dueDate &&
                    new Date(inv.dueDate) < new Date() &&
                    inv.status !== 'paid';

                  return (
                    <tr
                      key={inv.id}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className={styles.td}>
                        <span className={styles.docNumber}>{inv.invoiceNumber}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.customerName}>{custName}</div>
                        {custComp && (
                          <div className={styles.customerCompany}>{custComp}</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{formatCurrency(inv.total, inv.currency)}</strong>
                      </td>
                      <td className={styles.td} style={{ color: '#16a34a' }}>
                        {formatCurrency(inv.amountPaid || 0, inv.currency)}
                      </td>
                      <td className={styles.td}>
                        <span style={inv.balanceDue > 0 ? { color: '#ea580c', fontWeight: 600 } : {}}>
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </span>
                      </td>
                      <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                        <select
                          className={styles.statusSelectInline}
                          value={isOverdue ? 'overdue' : (inv.status || 'draft')}
                          onChange={(e) => handleStatusChange(e, inv.id, e.target.value)}
                          title="Change invoice status"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className={styles.td}>
                        <span className={isOverdue ? styles.overdueHighlight : ''}>
                          {formatDate(inv.dueDate) || '—'}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div
                          className={styles.actionsCell}
                          style={{ justifyContent: 'flex-end' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inv.balanceDue > 0 && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title="Record Payment"
                              onClick={(e) => handleOpenPayment(e, inv)}
                              style={{ color: '#16a34a' }}
                            >
                              <CreditCard size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Download PDF"
                            onClick={(e) => handleDownloadPdf(e, inv.id, inv.invoiceNumber)}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Edit Invoice"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Delete Invoice"
                            onClick={() => setDeleteTarget(inv)}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title={`Record Payment for ${paymentTarget?.invoiceNumber}`}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setPaymentTarget(null)}
              disabled={submittingPayment}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={CreditCard}
              loading={submittingPayment}
              onClick={handleRecordPayment}
            >
              {submittingPayment ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        }
      >
        {paymentTarget && (
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem' }}>
              <div>Total Invoice: <strong>{formatCurrency(paymentTarget.total, paymentTarget.currency)}</strong></div>
              <div>Remaining Balance: <strong style={{ color: '#ea580c' }}>{formatCurrency(paymentTarget.balanceDue, paymentTarget.currency)}</strong></div>
            </div>

            <Input
              label="Payment Amount"
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={paymentData.amount}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              autoFocus
            />

            <Input
              label="Payment Date"
              id="paymentDate"
              type="date"
              required
              value={paymentData.date}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, date: e.target.value }))}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor="paymentMethod" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                Payment Method
              </label>
              <select
                id="paymentMethod"
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: '#ffffff',
                }}
                value={paymentData.method}
                onChange={(e) => setPaymentData((prev) => ({ ...prev, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Reference / Transaction ID"
              id="reference"
              type="text"
              placeholder="e.g. Check #1042 or Wire Ref #9928"
              value={paymentData.reference}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, reference: e.target.value }))}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor="paymentNotes" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                Payment Notes
              </label>
              <textarea
                id="paymentNotes"
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="Optional payment notes..."
                value={paymentData.notes}
                onChange={(e) => setPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Invoice"
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
              {deleting ? 'Deleting...' : 'Delete Invoice'}
            </Button>
          </div>
        }
      >
        <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete invoice{' '}
          <strong>{deleteTarget?.invoiceNumber}</strong>?
          {(deleteTarget?.payments?.length > 0 || deleteTarget?.amountPaid > 0) && (
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#ea580c' }}>
              Note: This invoice has recorded payments totaling{' '}
              {formatCurrency(deleteTarget?.amountPaid, deleteTarget?.currency)}. Deleting it will also remove those payments.
            </span>
          )}
        </p>
      </Modal>
    </div>
  );
}
