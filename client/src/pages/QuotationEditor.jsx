import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2,
  UserCircle,
  FileText,
  List,
  Tag,
  Save,
  Download,
  Eye,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatInputDate } from '../utils/formatters';
import { calculateTotals } from '../utils/calculations';
import Button from '../components/Button';
import LineItemsTable from '../components/LineItemsTable';
import DocumentPreview from '../components/DocumentPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/editor.module.css';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

export default function QuotationEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  const [company, setCompany] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Form State
  const [quoteNumber, setQuoteNumber] = useState('');
  const [status, setStatus] = useState('draft');
  const [issueDate, setIssueDate] = useState(() => formatInputDate(new Date()));
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return formatInputDate(d);
  });
  const [currency, setCurrency] = useState('USD');

  // Customer snapshot info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    company: '',
    email: '',
    address: '',
  });

  // Line items
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  // Pricing
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  // Notes and terms
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Linked invoice info if converted
  const [linkedInvoice, setLinkedInvoice] = useState(null);

  // Initial data loading
  useEffect(() => {
    async function initEditor() {
      try {
        setLoading(true);

        const [companyRes, customersRes] = await Promise.all([
          api.get('/api/company').catch(() => ({ company: {} })),
          api.get('/api/customers').catch(() => ({ customers: [] })),
        ]);

        const comp = companyRes.company || {};
        setCompany(comp);
        setCustomers(customersRes.customers || []);

        if (isEdit) {
          const quoteRes = await api.get(`/api/quotations/${id}`);
          const quote = quoteRes.quotation;

          if (!quote) {
            showToast('Quotation not found', 'error');
            navigate('/quotations');
            return;
          }

          setQuoteNumber(quote.quoteNumber || '');
          setStatus(quote.status || 'draft');
          setIssueDate(formatInputDate(quote.issueDate));
          setExpiryDate(formatInputDate(quote.expiryDate));
          setCurrency(quote.currency || comp.defaultCurrency || 'USD');

          setSelectedCustomerId(quote.customerId || '');
          setCustomerInfo({
            name: quote.customer?.name || quote.customerName || '',
            company: quote.customer?.company || quote.customerCompany || '',
            email: quote.customer?.email || quote.customerEmail || '',
            address: quote.customerAddress || (quote.customer ? [quote.customer.address, quote.customer.city, quote.customer.state, quote.customer.zipCode, quote.customer.country].filter(Boolean).join(', ') : ''),
          });

          setDiscountType(quote.discountType || 'percentage');
          setDiscountValue(quote.discountValue ?? 0);
          setTaxRate(quote.taxRate ?? (comp.defaultTaxRate || 0));
          setNotes(quote.notes || '');
          setPaymentTerms(quote.paymentTerms || '');

          if (quote.lineItems && quote.lineItems.length > 0) {
            setLineItems(
              quote.lineItems.map((item) => ({
                description: item.description || '',
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice ?? 0,
                amount: item.amount ?? 0,
              }))
            );
          }

          if (quote.invoice) {
            setLinkedInvoice(quote.invoice);
          }
        } else {
          // New quotation defaults
          const prefix = comp.quotePrefix || 'QT';
          const nextNum = comp.nextQuoteNumber || 1;
          setQuoteNumber(`${prefix}-${String(nextNum).padStart(4, '0')}`);
          setCurrency(comp.defaultCurrency || 'USD');
          setTaxRate(comp.defaultTaxRate || 0);
          setNotes(comp.defaultNotes || '');
          setPaymentTerms(comp.defaultPaymentTerms || '');
        }
      } catch (err) {
        console.error('Failed to initialize quotation editor:', err);
        showToast('Error loading quotation data', 'error');
      } finally {
        setLoading(false);
      }
    }

    initEditor();
  }, [id, isEdit, navigate, showToast]);

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;

    const found = customers.find((c) => c.id === customerId);
    if (found) {
      const fullAddress = [
        found.address,
        found.city,
        found.state,
        found.zipCode,
        found.country,
      ]
        .filter(Boolean)
        .join(', ');

      setCustomerInfo({
        name: found.name || '',
        company: found.company || '',
        email: found.email || '',
        address: fullAddress,
      });
    }
  };

  // Calculations
  const totals = useMemo(() => {
    return calculateTotals(lineItems, discountType, discountValue, taxRate);
  }, [lineItems, discountType, discountValue, taxRate]);

  // Preview Data Object
  const previewData = useMemo(() => {
    return {
      type: 'quotation',
      number: quoteNumber || 'QT-DRAFT',
      quoteNumber: quoteNumber || 'QT-DRAFT',
      status,
      issueDate,
      expiryDate,
      currency,
      company: {
        name: company?.companyName || 'Your Business Name',
        email: company?.email || '',
        phone: company?.phone || '',
        address: company?.address || '',
        city: company?.city || '',
        state: company?.state || '',
        postalCode: company?.zipCode || '',
        country: company?.country || '',
        taxId: company?.taxId || '',
        logoUrl: company?.logoUrl || '',
      },
      customer: {
        name: customerInfo.name || 'Customer Name',
        customerName: customerInfo.name || 'Customer Name',
        companyName: customerInfo.company || '',
        email: customerInfo.email || '',
        address: customerInfo.address || '',
      },
      lineItems,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount: totals.discountAmount,
      taxRate: Number(taxRate) || 0,
      taxAmount: totals.taxAmount,
      subtotal: totals.subtotal,
      total: totals.total,
      notes,
      paymentTerms,
    };
  }, [
    quoteNumber,
    status,
    issueDate,
    expiryDate,
    currency,
    company,
    customerInfo,
    lineItems,
    discountType,
    discountValue,
    taxRate,
    totals,
    notes,
    paymentTerms,
  ]);

  // Save handler
  const handleSave = async (overrideStatus) => {
    const finalStatus = overrideStatus || status || 'draft';

    if (!customerInfo.name.trim()) {
      showToast('Please enter a customer name.', 'error');
      return;
    }

    const validItems = lineItems.filter((i) => i.description.trim() !== '');
    if (validItems.length === 0) {
      showToast('Please add at least one line item with a description.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId || null,
        ...(isEdit ? { quoteNumber: quoteNumber.trim() } : {}),
        status: finalStatus,
        issueDate: new Date(issueDate).toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        currency,
        customerName: customerInfo.name.trim(),
        customerCompany: customerInfo.company.trim(),
        customerEmail: customerInfo.email.trim(),
        customerAddress: customerInfo.address.trim(),
        lineItems: validItems,
        discountType,
        discountValue: Number(discountValue) || 0,
        taxRate: Number(taxRate) || 0,
        notes: notes.trim(),
        paymentTerms: paymentTerms.trim(),
      };

      let result;
      if (isEdit) {
        result = await api.put(`/api/quotations/${id}`, payload);
        showToast('Quotation updated successfully', 'success');
      } else {
        result = await api.post('/api/quotations', payload);
        showToast('Quotation created successfully', 'success');
        if (result?.quotation?.id) {
          navigate(`/quotations/${result.quotation.id}`, { replace: true });
        }
      }

      if (overrideStatus) {
        setStatus(overrideStatus);
      }
    } catch (err) {
      console.error('Failed to save quotation:', err);
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Failed to save quotation';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isEdit) {
      showToast('Please save your quotation first before downloading the PDF.', 'info');
      return;
    }
    try {
      await api.downloadFile(`/api/pdf/quotation/${id}`, `Quotation-${quoteNumber || id}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading quotation details..." />;
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/quotations')}
            title="Back to Quotations"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className={styles.pageTitle}>
            {isEdit ? `Edit Quotation ${quoteNumber}` : 'Create Quotation'}
          </h1>
        </div>

        <div className={styles.actionBar}>
          <Button
            type="button"
            variant="secondary"
            className={styles.mobileToggleBtn}
            icon={Eye}
            onClick={() => setShowMobilePreview((prev) => !prev)}
          >
            {showMobilePreview ? 'Show Form' : 'Show Preview'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            icon={Save}
            loading={saving}
            onClick={() => handleSave('draft')}
          >
            Save Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            icon={Download}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {linkedInvoice && (
        <div className={styles.convertedBanner}>
          <span>
            This quotation was converted to Invoice{' '}
            <strong>{linkedInvoice.invoiceNumber}</strong>.
          </span>
          <Link to={`/invoices/${linkedInvoice.id}`}>
            View Invoice <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Link>
        </div>
      )}

      {/* Two Column Layout */}
      <div className={styles.editorLayout}>
        {/* Left Side: Editor Form */}
        <div
          className={`${styles.editorPanel} ${
            showMobilePreview ? styles.editorPanelHiddenMobile : ''
          }`}
        >
          {/* Section 1: Business Information */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Building2 size={18} className={styles.sectionIcon} />
                <span>1. Business Information</span>
              </div>
              <Link to="/settings/company" className={styles.sectionHeaderLink}>
                Edit Business Info
              </Link>
            </div>

            <div className={styles.readOnlyBox}>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Business Name</span>
                <span className={styles.readOnlyValue}>
                  {company?.companyName || 'Not configured'}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Email</span>
                <span className={styles.readOnlyValue}>
                  {company?.email || '—'}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Phone</span>
                <span className={styles.readOnlyValue}>
                  {company?.phone || '—'}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Tax ID</span>
                <span className={styles.readOnlyValue}>
                  {company?.taxId || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <UserCircle size={18} className={styles.sectionIcon} />
                <span>2. Customer Information</span>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fullWidth} style={{ marginBottom: '0.25rem' }}>
                <label className={styles.label} htmlFor="customerSelect">
                  Choose from Saved Customers
                </label>
                <select
                  id="customerSelect"
                  className={styles.select}
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">-- Select or type customer details below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="custName">
                  Customer Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="custName"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className={styles.input}
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="custCompany">
                  Company Name
                </label>
                <input
                  id="custCompany"
                  type="text"
                  placeholder="e.g. Acme Inc"
                  className={styles.input}
                  value={customerInfo.company}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, company: e.target.value }))
                  }
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="custEmail">
                  Email Address
                </label>
                <input
                  id="custEmail"
                  type="email"
                  placeholder="e.g. john@acme.com"
                  className={styles.input}
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="custAddress">
                  Billing Address
                </label>
                <input
                  id="custAddress"
                  type="text"
                  placeholder="Street, City, State, Country"
                  className={styles.input}
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quotation Details */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FileText size={18} className={styles.sectionIcon} />
                <span>3. Quotation Details</span>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="quoteNumber">
                  Quote Number <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>(Auto-increment)</span>
                </label>
                <input
                  id="quoteNumber"
                  type="text"
                  required
                  readOnly
                  className={styles.input}
                  value={quoteNumber}
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155' }}
                  title="Auto-incremented quotation number"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  className={styles.select}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="issueDate">
                  Issue Date
                </label>
                <input
                  id="issueDate"
                  type="date"
                  className={styles.input}
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="expiryDate">
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  className={styles.input}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Line Items */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <List size={18} className={styles.sectionIcon} />
                <span>4. Line Items</span>
              </div>
            </div>

            <LineItemsTable
              items={lineItems}
              onChange={setLineItems}
              currency={currency}
            />
          </div>

          {/* Section 5: Pricing */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Tag size={18} className={styles.sectionIcon} />
                <span>5. Pricing</span>
              </div>
            </div>

            <div className={styles.pricingRow}>
              <span className={styles.pricingLabel}>Subtotal</span>
              <span className={styles.pricingValue}>
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            <div className={styles.pricingControlsRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="discountValue">
                  Discount
                </label>
                <div className={styles.discountInputGroup}>
                  <input
                    id="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.input}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                  <select
                    className={styles.select}
                    style={{ width: '100px' }}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="taxRate">
                  Tax / VAT (%)
                </label>
                <input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={styles.input}
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>

            {totals.discountAmount > 0 && (
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>
                  Discount Amount{' '}
                  {discountType === 'percentage' ? `(${discountValue}%)` : ''}
                </span>
                <span className={styles.pricingValue} style={{ color: '#ef4444' }}>
                  -{formatCurrency(totals.discountAmount, currency)}
                </span>
              </div>
            )}

            {totals.taxAmount > 0 && (
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>Tax Amount ({taxRate}%)</span>
                <span className={styles.pricingValue}>
                  +{formatCurrency(totals.taxAmount, currency)}
                </span>
              </div>
            )}

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Grand Total</span>
              <span className={styles.totalValue}>
                {formatCurrency(totals.total, currency)}
              </span>
            </div>
          </div>

          {/* Section 6: Notes and Terms */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FileText size={18} className={styles.sectionIcon} />
                <span>6. Notes and Terms</span>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fullWidth}>
                <label className={styles.label} htmlFor="quoteNotes">
                  Quotation Notes
                </label>
                <div className={styles.textareaWrapper}>
                  <textarea
                    id="quoteNotes"
                    className={styles.textarea}
                    maxLength={1000}
                    placeholder="Provide additional details, thank you notes, or delivery estimates..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <span className={styles.charCounter}>{notes.length} / 1000</span>
                </div>
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.label} htmlFor="quoteTerms">
                  Payment Terms &amp; Conditions
                </label>
                <div className={styles.textareaWrapper}>
                  <textarea
                    id="quoteTerms"
                    className={styles.textarea}
                    maxLength={1000}
                    placeholder="Specify validity period, milestones, deposit requirements..."
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                  <span className={styles.charCounter}>
                    {paymentTerms.length} / 1000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/quotations')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={Save}
              loading={saving}
              onClick={() => handleSave(status)}
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Quotation'}
            </Button>
          </div>
        </div>

        {/* Right Side: Live Document Preview */}
        <div
          className={`${styles.previewPanel} ${
            !showMobilePreview ? styles.previewPanelHiddenMobile : ''
          }`}
        >
          <div className={styles.previewCard}>
            <div className={styles.previewToolbar}>
              <span className={styles.previewDocBadge}>A4 Preview</span>

              <div className={styles.zoomControls}>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  title="Zoom Out"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
                >
                  <ZoomOut size={14} />
                </button>
                <span className={styles.zoomLevel}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  title="Zoom In"
                  onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  title="Reset Zoom"
                  onClick={() => setZoomLevel(0.85)}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            <div className={styles.previewScrollArea}>
              <div
                className={styles.previewTransformContainer}
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <DocumentPreview data={previewData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
