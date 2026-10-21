import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  Receipt,
  Search,
  Plus,
  Edit2,
  ExternalLink,
  Download,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/documents.module.css';

export default function Documents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'quotations', 'invoices'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [quotesRes, invoicesRes] = await Promise.all([
        api.get('/api/quotations').catch(() => ({ quotations: [] })),
        api.get('/api/invoices').catch(() => ({ invoices: [] })),
      ]);

      setQuotations(quotesRes.quotations || []);
      setInvoices(invoicesRes.invoices || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine and sort documents
  const mergedDocuments = useMemo(() => {
    const quoteDocs = quotations.map((q) => ({
      ...q,
      docType: 'quotation',
      number: q.quoteNumber,
      date: q.issueDate || q.createdAt,
      editUrl: `/quotations/${q.id}`,
      pdfUrl: `/api/pdf/quotation/${q.id}`,
    }));

    const invDocs = invoices.map((inv) => ({
      ...inv,
      docType: 'invoice',
      number: inv.invoiceNumber,
      date: inv.issueDate || inv.createdAt,
      editUrl: `/invoices/${inv.id}`,
      pdfUrl: `/api/pdf/invoice/${inv.id}`,
    }));

    let allDocs = [];
    if (activeTab === 'quotations') {
      allDocs = quoteDocs;
    } else if (activeTab === 'invoices') {
      allDocs = invDocs;
    } else {
      allDocs = [...quoteDocs, ...invDocs];
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allDocs = allDocs.filter((doc) => {
        const num = (doc.number || '').toLowerCase();
        const custName = (doc.customer?.name || doc.customerName || '').toLowerCase();
        const custComp = (doc.customer?.company || doc.customerCompany || '').toLowerCase();
        return num.includes(q) || custName.includes(q) || custComp.includes(q);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      allDocs = allDocs.filter(
        (doc) => (doc.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort by date descending
    allDocs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return allDocs;
  }, [quotations, invoices, activeTab, searchQuery, statusFilter]);

  const handleDownloadPdf = async (e, pdfUrl) => {
    e.stopPropagation();
    try {
      await api.downloadFile(pdfUrl);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleStatusChange = async (e, doc, newStatus) => {
    e.stopPropagation();
    try {
      const endpoint = doc.docType === 'quotation'
        ? `/api/quotations/${doc.id}/status`
        : `/api/invoices/${doc.id}/status`;
      await api.patch(endpoint, { status: newStatus });
      if (doc.docType === 'quotation') {
        setQuotations((prev) =>
          prev.map((item) => (item.id === doc.id ? { ...item, status: newStatus } : item))
        );
      } else {
        setInvoices((prev) =>
          prev.map((item) => (item.id === doc.id ? { ...item, status: newStatus } : item))
        );
      }
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
          <h1 className={styles.headerTitle}>Documents</h1>
          <p className={styles.headerSubtitle}>
            Overview of all your quotations and invoices in one unified feed
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            icon={FileCheck}
            onClick={() => navigate('/quotations/new')}
          >
            New Quotation
          </Button>
          <Button
            variant="primary"
            icon={Receipt}
            onClick={() => navigate('/invoices/new')}
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FileText size={16} />
            All Documents ({quotations.length + invoices.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'quotations' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('quotations')}
          >
            <FileCheck size={16} />
            Quotations ({quotations.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <Receipt size={16} />
            Invoices ({invoices.length})
          </button>
        </div>

        <div className={styles.filterControls}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.statusSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner fullPage={false} message="Loading documents..." />
      ) : mergedDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try modifying your search or clearing the status filter.'
              : 'Create your first quotation or invoice to populate your documents feed.'
          }
          action={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() => navigate('/quotations/new')}
              >
                Create Quotation
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/invoices/new')}
              >
                Create Invoice
              </Button>
            </div>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Number</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mergedDocuments.map((doc) => {
                  const isQuote = doc.docType === 'quotation';
                  const custName = doc.customer?.name || doc.customerName || '—';
                  const custComp = doc.customer?.company || doc.customerCompany;

                  return (
                    <tr
                      key={`${doc.docType}-${doc.id}`}
                      className={styles.clickableRow}
                      onClick={() => navigate(doc.editUrl)}
                    >
                      <td className={styles.td}>
                        <span
                          className={`${styles.typeBadge} ${
                            isQuote ? styles.typeBadgeQT : styles.typeBadgeINV
                          }`}
                        >
                          {isQuote ? 'QT' : 'INV'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.docNumber}>{doc.number}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.customerName}>{custName}</div>
                        {custComp && (
                          <div className={styles.customerCompany}>{custComp}</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{formatCurrency(doc.total, doc.currency)}</strong>
                      </td>
                      <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                        <select
                          className={styles.statusSelectInline}
                          value={doc.status || 'draft'}
                          onChange={(e) => handleStatusChange(e, doc, e.target.value)}
                          title={`Change ${doc.docType} status`}
                        >
                          {doc.docType === 'quotation' ? (
                            <>
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                              <option value="expired">Expired</option>
                              <option value="converted">Converted</option>
                            </>
                          ) : (
                            <>
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="unpaid">Unpaid</option>
                              <option value="partially_paid">Partially Paid</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                              <option value="cancelled">Cancelled</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td className={styles.td}>{formatDate(doc.date)}</td>
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
                            onClick={(e) => handleDownloadPdf(e, doc.pdfUrl)}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Edit Document"
                            onClick={() => navigate(doc.editUrl)}
                          >
                            <Edit2 size={15} />
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
    </div>
  );
}
