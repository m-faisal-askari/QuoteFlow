import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  UserCircle,
  Receipt,
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
  CreditCard,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatInputDate } from '../utils/formatters';
import { calculateTotals } from '../utils/calculations';
import Button from '../components/Button';
import LineItemsTable from '../components/LineItemsTable';
import DocumentPreview from '../components/DocumentPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Input from '../components/Input';
import styles from '../styles/editor.module.css';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const PAYMENT_METHODS = [
  'Bank Transfer',
  'Credit Card',
  'Cash',
  'Check',
  'PayPal',
  'Stripe',
  'Other',
];

export default function InvoiceEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const quotationIdParam = searchParams.get('quotationId');
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
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('draft');
  const [issueDate, setIssueDate] = useState(() => formatInputDate(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
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
  const [amountPaid, setAmountPaid] = useState(0);

  // Notes and terms
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Linked quotation info
  const [linkedQuotation, setLinkedQuotation] = useState(null);

  // Quick Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: formatInputDate(new Date()),
    method: 'Bank Transfer',
    reference: '',
    notes: '',
  });

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
          const invRes = await api.get(`/api/invoices/${id}`);
          const inv = invRes.invoice;

          if (!inv) {
            showToast('Invoice not found', 'error');
            navigate('/invoices');
            return;
          }

          setInvoiceNumber(inv.invoiceNumber || '');
          setStatus(inv.status || 'draft');
          setIssueDate(formatInputDate(inv.issueDate));
          setDueDate(formatInputDate(inv.dueDate));
          setCurrency(inv.currency || comp.defaultCurrency || 'USD');

          setSelectedCustomerId(inv.customerId || '');
          setCustomerInfo({
            name: inv.customer?.name || inv.customerName || '',
            company: inv.customer?.company || inv.customerCompany || '',
            email: inv.customer?.email || inv.customerEmail || '',
            address:
              inv.customerAddress ||
              (inv.customer
                ? [
                    inv.customer.address,
                    inv.customer.city,
                    inv.customer.state,
                    inv.customer.zipCode,
                    inv.customer.country,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : ''),
          });

          setDiscountType(inv.discountType || 'percentage');
          setDiscountValue(inv.discountValue ?? 0);
          setTaxRate(inv.taxRate ?? (comp.defaultTaxRate || 0));
          setAmountPaid(inv.amountPaid || 0);
          setNotes(inv.notes || '');
          setPaymentTerms(inv.paymentTerms || '');

          if (inv.lineItems && inv.lineItems.length > 0) {
            setLineItems(
              inv.lineItems.map((item) => ({
                description: item.description || '',
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice ?? 0,
                amount: item.amount ?? 0,
              }))
            );
          }

          if (inv.quotation) {
            setLinkedQuotation(inv.quotation);
          }
        } else if (quotationIdParam) {
          // Preload from converted quotation
          const quoteRes = await api.get(`/api/quotations/${quotationIdParam}`);
          const quote = quoteRes.quotation;

          const prefix = comp.invoicePrefix || 'INV';
          const nextNum = comp.nextInvoiceNumber || 1;
          setInvoiceNumber(`${prefix}-${String(nextNum).padStart(4, '0')}`);

          if (quote) {
            setLinkedQuotation(quote);
            setSelectedCustomerId(quote.customerId || '');
            setCustomerInfo({
              name: quote.customerName || quote.customer?.name || '',
              company: quote.customerCompany || quote.customer?.company || '',
              email: quote.customerEmail || quote.customer?.email || '',
              address: quote.customerAddress || '',
            });
            setCurrency(quote.currency || comp.defaultCurrency || 'USD');
            setDiscountType(quote.discountType || 'percentage');
            setDiscountValue(quote.discountValue ?? 0);
            setTaxRate(quote.taxRate ?? (comp.defaultTaxRate || 0));
            setNotes(quote.notes || comp.defaultNotes || '');
            setPaymentTerms(quote.paymentTerms || comp.defaultPaymentTerms || '');

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
          }
        } else {
          // New invoice defaults
          const prefix = comp.invoicePrefix || 'INV';
          const nextNum = comp.nextInvoiceNumber || 1;
          setInvoiceNumber(`${prefix}-${String(nextNum).padStart(4, '0')}`);
          setCurrency(comp.defaultCurrency || 'USD');
          setTaxRate(comp.defaultTaxRate || 0);
          setNotes(comp.defaultNotes || '');
          setPaymentTerms(comp.defaultPaymentTerms || '');
        }
      } catch (err) {
        console.error('Failed to initialize invoice editor:', err);
        showToast('Error loading invoice details', 'error');
      } finally {
        setLoading(false);
      }
    }

    initEditor();
  }, [id, isEdit, quotationIdParam, navigate, showToast]);

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
    const computed = calculateTotals(lineItems, discountType, discountValue, taxRate);
    const balanceDue = Math.max(0, Math.round((computed.total - amountPaid) * 100) / 100);
    return {
      ...computed,
      balanceDue,
    };
  }, [lineItems, discountType, discountValue, taxRate, amountPaid]);

  // Preview Data Object
  const previewData = useMemo(() => {
    return {
      type: 'invoice',
      number: invoiceNumber || 'INV-DRAFT',
      invoiceNumber: invoiceNumber || 'INV-DRAFT',
      status,
      issueDate,
      dueDate,
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
    invoiceNumber,
    status,
    issueDate,
    dueDate,
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
        quotationId: linkedQuotation?.id || quotationIdParam || null,
        ...(isEdit ? { invoiceNumber: invoiceNumber.trim() } : {}),
        status: finalStatus,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
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
        result = await api.put(`/api/invoices/${id}`, payload);
        showToast('Invoice updated successfully', 'success');
      } else {
        result = await api.post('/api/invoices', payload);
        showToast('Invoice created successfully', 'success');
        if (result?.invoice?.id) {
          navigate(`/invoices/${result.invoice.id}`, { replace: true });
        }
      }

      if (overrideStatus) {
        setStatus(overrideStatus);
      }
    } catch (err) {
      console.error('Failed to save invoice:', err);
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Failed to save invoice';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isEdit) {
      showToast('Please save your invoice first before downloading the PDF.', 'info');
      return;
    }
    try {
      await api.downloadFile(`/api/pdf/invoice/${id}`, `Invoice-${invoiceNumber || id}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!id) return;

    const numAmount = parseFloat(paymentData.amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid payment amount greater than zero.', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.post(`/api/invoices/${id}/payments`, {
        amount: numAmount,
        date: new Date(paymentData.date).toISOString(),
        method: paymentData.method,
        reference: paymentData.reference.trim(),
        notes: paymentData.notes.trim(),
      });

      showToast(`Payment of ${formatCurrency(numAmount, currency)} recorded!`, 'success');
      setShowPaymentModal(false);

      if (res?.invoice) {
        setAmountPaid(res.invoice.amountPaid || 0);
        setStatus(res.invoice.status || status);
      }
    } catch (err) {
      console.error('Record payment failed:', err);
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading invoice details..." />;
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/invoices')}
            title="Back to Invoices"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className={styles.pageTitle}>
            {isEdit ? `Edit Invoice ${invoiceNumber}` : 'Create Invoice'}
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

          {isEdit && totals.balanceDue > 0 && (
            <Button
              type="button"
              variant="secondary"
              icon={CreditCard}
              onClick={() => {
                setPaymentData({
                  amount: String(totals.balanceDue),
                  date: formatInputDate(new Date()),
                  method: 'Bank Transfer',
                  reference: '',
                  notes: '',
                });
                setShowPaymentModal(true);
              }}
            >
              Record Payment
            </Button>
          )}

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

      {linkedQuotation && (
        <div className={styles.convertedBanner}>
          <span>
            Converted from Quotation <strong>{linkedQuotation.quoteNumber}</strong>.
          </span>
          <Link to={`/quotations/${linkedQuotation.id}`}>
            View Original Quotation{' '}
            <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
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
                  placeholder="e.g. Acme Client"
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
                  placeholder="e.g. Acme Global Inc"
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
                  placeholder="e.g. finance@acme.com"
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

          {/* Section 3: Invoice Details */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Receipt size={18} className={styles.sectionIcon} />
                <span>3. Invoice Details</span>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="invoiceNumber">
                  Invoice Number <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>(Auto-increment)</span>
                </label>
                <input
                  id="invoiceNumber"
                  type="text"
                  required
                  readOnly
                  className={styles.input}
                  value={invoiceNumber}
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155' }}
                  title="Auto-incremented invoice number"
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
                <label className={styles.label} htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  className={styles.input}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="status">
                  Invoice Status
                </label>
                <select
                  id="status"
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
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

          {/* Section 5: Pricing & Payments */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Tag size={18} className={styles.sectionIcon} />
                <span>5. Pricing &amp; Balance</span>
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

            {isEdit && (
              <>
                <div className={styles.balanceRow}>
                  <span className={styles.pricingLabel}>Amount Paid</span>
                  <span className={styles.pricingValue} style={{ color: '#16a34a' }}>
                    {formatCurrency(amountPaid, currency)}
                  </span>
                </div>

                <div className={styles.balanceRow}>
                  <span className={styles.pricingLabel} style={{ fontWeight: 600 }}>
                    Balance Due
                  </span>
                  <span
                    className={styles.pricingValue}
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: totals.balanceDue > 0 ? '#ea580c' : '#16a34a',
                    }}
                  >
                    {formatCurrency(totals.balanceDue, currency)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Section 6: Notes and Terms */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Receipt size={18} className={styles.sectionIcon} />
                <span>6. Notes and Terms</span>
              </div>
            </div>

            <div className={styles.gridTwoCols}>
              <div className={styles.fullWidth}>
                <label className={styles.label} htmlFor="invoiceNotes">
                  Invoice Notes
                </label>
                <div className={styles.textareaWrapper}>
                  <textarea
                    id="invoiceNotes"
                    className={styles.textarea}
                    maxLength={1000}
                    placeholder="Enter payment instructions, bank details, or thank you note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <span className={styles.charCounter}>{notes.length} / 1000</span>
                </div>
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.label} htmlFor="invoiceTerms">
                  Payment Terms &amp; Policies
                </label>
                <div className={styles.textareaWrapper}>
                  <textarea
                    id="invoiceTerms"
                    className={styles.textarea}
                    maxLength={1000}
                    placeholder="Specify late fee policy, accepted payment modes, wire routing info..."
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
              onClick={() => navigate('/invoices')}
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
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
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
              <span className={styles.previewDocBadge}>A4 Invoice Preview</span>

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

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Record Payment for ${invoiceNumber}`}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
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
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem' }}>
            <div>Total Invoice: <strong>{formatCurrency(totals.total, currency)}</strong></div>
            <div>Remaining Balance: <strong style={{ color: '#ea580c' }}>{formatCurrency(totals.balanceDue, currency)}</strong></div>
          </div>

          <Input
            label="Payment Amount"
            id="modalPaymentAmount"
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
            id="modalPaymentDate"
            type="date"
            required
            value={paymentData.date}
            onChange={(e) => setPaymentData((prev) => ({ ...prev, date: e.target.value }))}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="modalPaymentMethod" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
              Payment Method
            </label>
            <select
              id="modalPaymentMethod"
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
            id="modalPaymentRef"
            type="text"
            placeholder="e.g. Wire confirmation or check #"
            value={paymentData.reference}
            onChange={(e) => setPaymentData((prev) => ({ ...prev, reference: e.target.value }))}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="modalPaymentNotes" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
              Payment Notes
            </label>
            <textarea
              id="modalPaymentNotes"
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                minHeight: '60px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              placeholder="Optional notes..."
              value={paymentData.notes}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
