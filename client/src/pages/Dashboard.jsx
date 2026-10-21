import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileCheck,
  Receipt,
  CircleDollarSign,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText,
  Clock,
  Send,
  CheckCircle,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading dashboard overview..." />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={AlertCircle}
          title="Something went wrong"
          description={error}
          action={
            <Button variant="primary" onClick={fetchDashboardData}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentQuotations = data?.recentQuotations || [];
  const recentInvoices = data?.recentInvoices || [];

  const hasDocuments =
    (stats.totalQuotations || 0) > 0 || (stats.totalInvoices || 0) > 0;

  if (!hasDocuments) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Dashboard</h1>
        </div>

        <EmptyState
          icon={FileText}
          title="Welcome to QuoteFlow!"
          description="You haven't created any quotations or invoices yet. Get started by creating your first quotation or setting up your company profile."
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/quotations/new')}
              >
                Create Quotation
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/settings/company')}
              >
                Company Settings
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Dashboard</h1>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/quotations/new')}
          >
            New Quotation
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/invoices/new')}
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* Row 1: Primary Stats Cards */}
      <div className={styles.statsGridPrimary}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconBlue}`}>
            <FileCheck size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Quotations</span>
            <span className={styles.statValue}>{stats.totalQuotations || 0}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconGreen}`}>
            <Receipt size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Invoices</span>
            <span className={styles.statValue}>{stats.totalInvoices || 0}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconEmerald}`}>
            <CircleDollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Paid Invoices</span>
            <span className={styles.statValue}>{stats.paidInvoices || 0}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.iconOrange}`}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Outstanding Balance</span>
            <span className={styles.statValue}>
              {formatCurrency(stats.outstandingBalance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Smaller Stats Cards */}
      <div className={styles.statsGridSecondary}>
        <div className={styles.statCardSmall}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#64748b" />
            <span className={styles.statSmallTitle}>Draft Documents</span>
          </div>
          <span className={styles.statSmallValue}>{stats.draftDocuments || 0}</span>
        </div>

        <div className={styles.statCardSmall}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="#3b82f6" />
            <span className={styles.statSmallTitle}>Sent Documents</span>
          </div>
          <span className={styles.statSmallValue}>{stats.sentDocuments || 0}</span>
        </div>

        <div className={styles.statCardSmall}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="#22c55e" />
            <span className={styles.statSmallTitle}>Accepted Quotations</span>
          </div>
          <span className={styles.statSmallValue}>{stats.acceptedQuotations || 0}</span>
        </div>

        <div className={styles.statCardSmall}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span className={styles.statSmallTitle}>Overdue Invoices</span>
          </div>
          <span className={styles.statSmallValue}>
            {stats.overdueInvoices !== undefined
              ? stats.overdueInvoices
              : recentInvoices.filter((i) => i.status === 'overdue').length}
          </span>
        </div>
      </div>

      {/* Row 3: Recent Documents Tables */}
      <div className={styles.tablesGrid}>
        {/* Recent Quotations Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Recent Quotations</h2>
            <Link to="/quotations" className={styles.viewAllLink}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.tableWrapper}>
            {recentQuotations.length === 0 ? (
              <div className={styles.emptyTableMessage}>No quotations yet.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Quote #</th>
                    <th className={styles.th}>Customer</th>
                    <th className={styles.th}>Total</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotations.map((quote) => (
                    <tr key={quote.id} className={styles.tr}>
                      <td className={styles.td}>
                        <Link
                          to={`/quotations/${quote.id}`}
                          className={styles.docNumber}
                        >
                          {quote.quoteNumber}
                        </Link>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.customerName}>
                          {quote.customer?.name || quote.customerName || '—'}
                        </div>
                        {(quote.customer?.company || quote.customerCompany) && (
                          <div className={styles.customerCompany}>
                            {quote.customer?.company || quote.customerCompany}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{formatCurrency(quote.total, quote.currency)}</strong>
                      </td>
                      <td className={styles.td}>
                        <StatusBadge status={quote.status} type="quotation" />
                      </td>
                      <td className={styles.td}>
                        {formatDate(quote.issueDate || quote.createdAt)}
                      </td>
                      <td className={styles.td}>
                        <Link
                          to={`/quotations/${quote.id}`}
                          className={styles.actionLink}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Recent Invoices</h2>
            <Link to="/invoices" className={styles.viewAllLink}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.tableWrapper}>
            {recentInvoices.length === 0 ? (
              <div className={styles.emptyTableMessage}>No invoices yet.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Invoice #</th>
                    <th className={styles.th}>Customer</th>
                    <th className={styles.th}>Total</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Balance</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className={styles.tr}>
                      <td className={styles.td}>
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className={styles.docNumber}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.customerName}>
                          {invoice.customer?.name || invoice.customerName || '—'}
                        </div>
                        {(invoice.customer?.company || invoice.customerCompany) && (
                          <div className={styles.customerCompany}>
                            {invoice.customer?.company || invoice.customerCompany}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>
                          {formatCurrency(invoice.total, invoice.currency)}
                        </strong>
                      </td>
                      <td className={styles.td}>
                        <StatusBadge status={invoice.status} type="invoice" />
                      </td>
                      <td className={styles.td}>
                        {formatCurrency(invoice.balanceDue, invoice.currency)}
                      </td>
                      <td className={styles.td}>
                        {formatDate(invoice.issueDate || invoice.createdAt)}
                      </td>
                      <td className={styles.td}>
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className={styles.actionLink}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
