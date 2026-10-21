import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calculateTotals, calculateLineItemAmount } from '../utils/calculations';
import styles from '../styles/preview.module.css';

export default function DocumentPreview({ data = {} }) {
  const isInvoice = data.type === 'invoice';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const docNumber =
    data.number ||
    (isInvoice ? data.invoiceNumber : data.quoteNumber) ||
    'DRAFT';

  const issueDate = data.issueDate || data.date || data.createdAt;
  const secondDate = isInvoice
    ? data.dueDate
    : data.expiryDate || data.validUntil;

  const company = data.company || {};
  const customer = data.customer || {};
  const lineItems = data.lineItems || data.items || [];
  const currency = data.currency || company.currency || 'USD';

  // Calculate totals if not directly provided
  const computedTotals = calculateTotals(
    lineItems,
    data.discountType || 'percentage',
    data.discountValue || 0,
    data.taxRate || 0
  );

  const subtotal = data.subtotal !== undefined ? data.subtotal : computedTotals.subtotal;
  const discountAmount =
    data.discountAmount !== undefined ? data.discountAmount : computedTotals.discountAmount;
  const taxAmount = data.taxAmount !== undefined ? data.taxAmount : computedTotals.taxAmount;
  const total = data.total !== undefined ? data.total : computedTotals.total;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.documentPaper}>
        <div>
          {/* Header section */}
          <div className={styles.topSection}>
            <div className={styles.companyInfo}>
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name || 'Company Logo'}
                  className={styles.logo}
                />
              ) : null}
              <div className={styles.companyName}>
                {company.name || 'Your Company Name'}
              </div>
              <div className={styles.companyDetails}>
                {company.address && <div>{company.address}</div>}
                {company.city && (
                  <div>
                    {[company.city, company.state, company.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {company.country && <div>{company.country}</div>}
                {company.email && <div>Email: {company.email}</div>}
                {company.phone && <div>Phone: {company.phone}</div>}
                {company.taxId && <div>Tax ID: {company.taxId}</div>}
              </div>
            </div>

            <div className={styles.documentHeader}>
              <h1 className={styles.documentTitle}>{docTitle}</h1>
              <div className={styles.metaGrid}>
                <span className={styles.metaLabel}>Number:</span>
                <span className={styles.metaValue}>{docNumber}</span>

                <span className={styles.metaLabel}>Date:</span>
                <span className={styles.metaValue}>{formatDate(issueDate) || '—'}</span>

                <span className={styles.metaLabel}>
                  {isInvoice ? 'Due Date:' : 'Expires:'}
                </span>
                <span className={styles.metaValue}>{formatDate(secondDate) || '—'}</span>

                {data.status && (
                  <>
                    <span className={styles.metaLabel}>Status:</span>
                    <span
                      className={styles.metaValue}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {data.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className={styles.billToSection}>
            <div className={styles.sectionHeading}>Bill To</div>
            <div className={styles.customerName}>
              {customer.name || customer.customerName || 'Customer Name'}
            </div>
            <div className={styles.customerDetails}>
              {customer.companyName && <div>{customer.companyName}</div>}
              {customer.address && <div>{customer.address}</div>}
              {customer.email && <div>{customer.email}</div>}
              {customer.phone && <div>{customer.phone}</div>}
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.itemsSection}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '50%' }}>
                    Description
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} style={{ width: '15%' }}>
                    Quantity
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} style={{ width: '15%' }}>
                    Unit Price
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} style={{ width: '20%' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr className={styles.tr}>
                    <td
                      colSpan={4}
                      className={styles.td}
                      style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}
                    >
                      No line items
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => {
                    const amount =
                      item.amount !== undefined
                        ? item.amount
                        : calculateLineItemAmount(item.quantity, item.unitPrice);

                    return (
                      <tr key={index} className={styles.tr}>
                        <td className={`${styles.td} ${styles.itemDesc}`}>
                          {item.description || 'Item description'}
                        </td>
                        <td className={`${styles.td} ${styles.tdRight}`}>
                          {item.quantity ?? 1}
                        </td>
                        <td className={`${styles.td} ${styles.tdRight}`}>
                          {formatCurrency(item.unitPrice ?? 0, currency)}
                        </td>
                        <td className={`${styles.td} ${styles.tdRight} ${styles.tdAmount}`}>
                          {formatCurrency(amount, currency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsTable}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Subtotal</span>
                <span className={styles.totalValue}>{formatCurrency(subtotal, currency)}</span>
              </div>

              {Number(discountAmount) > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>
                    Discount {data.discountType === 'percentage' && data.discountValue ? `(${data.discountValue}%)` : ''}
                  </span>
                  <span className={styles.totalValue}>
                    -{formatCurrency(discountAmount, currency)}
                  </span>
                </div>
              )}

              {Number(taxAmount) > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>
                    Tax {data.taxRate ? `(${data.taxRate}%)` : ''}
                  </span>
                  <span className={styles.totalValue}>{formatCurrency(taxAmount, currency)}</span>
                </div>
              )}

              <div className={styles.grandTotalRow}>
                <span>Total</span>
                <span className={styles.grandTotalValue}>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes and Terms */}
        <div>
          {(data.notes || data.terms || data.paymentTerms) && (
            <div className={styles.notesTermsSection}>
              {data.notes && (
                <div className={styles.infoBlock}>
                  <div className={styles.infoBlockTitle}>Notes</div>
                  <div className={styles.infoBlockText}>{data.notes}</div>
                </div>
              )}

              {(data.terms || data.paymentTerms) && (
                <div className={styles.infoBlock}>
                  <div className={styles.infoBlockTitle}>Terms &amp; Conditions</div>
                  <div className={styles.infoBlockText}>{data.terms || data.paymentTerms}</div>
                </div>
              )}
            </div>
          )}

          <div className={styles.footerNote}>
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}
