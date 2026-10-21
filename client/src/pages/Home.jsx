import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Download,
  CreditCard,
  LayoutDashboard,
  Layers,
  Database,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/home.module.css';

const SAMPLE_DOCS = {
  quote: {
    type: 'Quotation',
    number: 'QT-1001',
    initialStatus: 'accepted',
    customer: 'BioGenix Healthcare Labs',
    contact: 'Dr. Liam Patel',
    email: 'liam.patel@biogenixlabs.org',
    issueDate: 'Oct 11, 2026',
    expiryDate: 'Oct 31, 2026',
    currency: 'USD',
    lineItems: [
      { desc: 'Patient Portal UI/UX Redesign', qty: 1, price: 4500.0, amount: 4500.0 },
      { desc: 'HIPAA-Compliant REST API Integration', qty: 1, price: 3000.0, amount: 3000.0 },
      { desc: 'Automated End-to-End Test Suite', qty: 1, price: 1000.0, amount: 1000.0 },
    ],
    subtotal: 8500.0,
    discountLabel: 'Discount (5%)',
    discountAmount: 425.0,
    taxLabel: 'Tax (8.25%)',
    taxAmount: 666.19,
    total: 8741.19,
    notes: 'Includes full architecture documentation and 30-day post-launch warranty.',
  },
  invoicePaid: {
    type: 'Invoice',
    number: 'INV-1001',
    initialStatus: 'paid',
    customer: 'Horizon Cloud Systems',
    contact: 'David Miller',
    email: 'david@horizoncloud.net',
    issueDate: 'Oct 01, 2026',
    dueDate: 'Oct 31, 2026',
    currency: 'USD',
    lineItems: [
      { desc: 'Kubernetes Cluster Hardening & CIS Benchmark Audit', qty: 1, price: 6500.0, amount: 6500.0 },
      { desc: 'Cloud Penetration Testing & Vulnerability Remediation', qty: 1, price: 4500.0, amount: 4500.0 },
    ],
    subtotal: 11000.0,
    discountLabel: null,
    discountAmount: 0,
    taxLabel: 'Tax (8.25%)',
    taxAmount: 907.5,
    total: 11907.5,
    amountPaid: 11907.5,
    balanceDue: 0.0,
    notes: 'Converted from Quotation #QT-1006. Full balance settled via Wire & ACH.',
  },
  invoiceOverdue: {
    type: 'Invoice',
    number: 'INV-1004',
    initialStatus: 'overdue',
    customer: 'Starlight Media & Entertainment',
    contact: 'Marcus Vance',
    email: 'm.vance@starlightmedia.co',
    issueDate: 'Sep 06, 2026',
    dueDate: 'Oct 06, 2026 (15 days overdue)',
    currency: 'USD',
    lineItems: [
      { desc: 'Video Stream Encoding & Transcoding Pipeline Optimization', qty: 1, price: 3000.0, amount: 3000.0 },
      { desc: 'Custom Analytics Dashboard for Viewership Metrics', qty: 1, price: 1500.0, amount: 1500.0 },
    ],
    subtotal: 4500.0,
    discountLabel: null,
    discountAmount: 0,
    taxLabel: 'Tax (8.25%)',
    taxAmount: 371.25,
    total: 4871.25,
    amountPaid: 0.0,
    balanceDue: 4871.25,
    notes: 'Payment is past the 30-day net terms. Remittance notice dispatched.',
  },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Interactive Workbench Demo state
  const [activeTab, setActiveTab] = useState('quote');
  const [statuses, setStatuses] = useState({
    quote: 'accepted',
    invoicePaid: 'paid',
    invoiceOverdue: 'overdue',
  });

  const currentDoc = SAMPLE_DOCS[activeTab];
  const currentStatus = statuses[activeTab];

  const handleStatusChange = (newStatus) => {
    setStatuses((prev) => ({ ...prev, [activeTab]: newStatus }));
  };

  return (
    <div className={styles.page}>
      {/* Header / Navbar */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img
              src="/quoteflow-icon.svg"
              alt="QuoteFlow"
              className={styles.logoImg}
            />
            <span className={styles.brandName}>QuoteFlow</span>
            <span className={styles.brandBadge}>PostgreSQL Edition</span>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#workbench" className={styles.navLink}>
              Interactive Demo
            </a>
            <a href="#architecture" className={styles.navLink}>
              Architecture
            </a>
            <a href="#comparison" className={styles.navLink}>
              Why QuoteFlow
            </a>
          </nav>

          <div className={styles.navActions}>
            {user ? (
              <Link to="/dashboard" className={styles.btnSolid}>
                <LayoutDashboard size={15} />
                <span>Open Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.btnText}>
                  Sign In
                </Link>
                <Link to="/register" className={styles.btnSolid}>
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badgePill}>
          <span className={styles.badgePillDot} />
          <span>Strict Sequential Auto-Increment &bull; Direct PDF Streaming &bull; Neon Cloud</span>
        </div>

        <h1 className={styles.heroHeadline}>
          Precision financial billing for modern client businesses.
        </h1>

        <p className={styles.heroSubtitle}>
          Draft structured quotations, issue sequential invoices, stream client-ready PDFs,
          and reconcile incoming settlements in real time. Designed for speed and audit-proof accuracy.
        </p>

        <div className={styles.heroCtaGroup}>
          {user ? (
            <button
              type="button"
              className={styles.btnPrimaryLarge}
              onClick={() => navigate('/dashboard')}
            >
              <span>Go to Your Workspace</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <Link to="/register" className={styles.btnPrimaryLarge}>
                <span>Create Free Workspace</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className={styles.btnOutlineLarge}>
                <span>Sign In to Account</span>
              </Link>
            </>
          )}
        </div>

        <div className={styles.trustBar}>
          <div className={styles.trustItem}>
            <CheckCircle2 size={15} className={styles.trustIcon} />
            <span>Collision-proof sequence engine</span>
          </div>
          <div className={styles.trustItem}>
            <CheckCircle2 size={15} className={styles.trustIcon} />
            <span>Zero-redirect PDF downloads</span>
          </div>
          <div className={styles.trustItem}>
            <CheckCircle2 size={15} className={styles.trustIcon} />
            <span>Real-time status transitions</span>
          </div>
          <div className={styles.trustItem}>
            <CheckCircle2 size={15} className={styles.trustIcon} />
            <span>Neon PostgreSQL cloud backend</span>
          </div>
        </div>
      </section>

      {/* Interactive Document Workbench */}
      <section id="workbench" className={styles.workbenchSection}>
        <div className={styles.workbenchCard}>
          {/* Top Workbench Bar */}
          <div className={styles.workbenchTopNav}>
            <div className={styles.workbenchTabs}>
              <button
                type="button"
                className={`${styles.workbenchTab} ${activeTab === 'quote' ? styles.workbenchTabActive : ''}`}
                onClick={() => setActiveTab('quote')}
              >
                <FileCheck size={14} />
                <span>Quotation</span>
                <span className={styles.tabDocCode}>QT-1001</span>
              </button>

              <button
                type="button"
                className={`${styles.workbenchTab} ${activeTab === 'invoicePaid' ? styles.workbenchTabActive : ''}`}
                onClick={() => setActiveTab('invoicePaid')}
              >
                <Receipt size={14} />
                <span>Invoice (Settled)</span>
                <span className={styles.tabDocCode}>INV-1001</span>
              </button>

              <button
                type="button"
                className={`${styles.workbenchTab} ${activeTab === 'invoiceOverdue' ? styles.workbenchTabActive : ''}`}
                onClick={() => setActiveTab('invoiceOverdue')}
              >
                <Receipt size={14} />
                <span>Invoice (Overdue)</span>
                <span className={styles.tabDocCode}>INV-1004</span>
              </button>
            </div>

            <div className={styles.workbenchActions}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                Status Control:
              </span>
              <select
                className={styles.workbenchStatusSelect}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                title="Change status in live interactive demo"
              >
                {activeTab === 'quote' ? (
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

              <button
                type="button"
                className={styles.btnSolid}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                title="Open in QuoteFlow"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Workbench Body */}
          <div className={styles.workbenchViewBody}>
            <div className={styles.docMetaGrid}>
              <div>
                <div className={styles.metaLabel}>Billed To Customer</div>
                <div className={styles.metaValue}>{currentDoc.customer}</div>
                <div className={styles.metaSub}>Attn: {currentDoc.contact} &bull; {currentDoc.email}</div>
              </div>

              <div>
                <div className={styles.metaLabel}>Document Number</div>
                <div className={styles.metaValue} style={{ fontFamily: 'ui-monospace, monospace' }}>
                  {currentDoc.number}
                </div>
                <div className={styles.metaSub}>
                  Status:{' '}
                  <strong style={{ textTransform: 'capitalize', color: '#2563eb' }}>
                    {currentStatus.replace('_', ' ')}
                  </strong>
                </div>
              </div>

              <div>
                <div className={styles.metaLabel}>
                  {activeTab === 'quote' ? 'Expiry Timeline' : 'Payment Due Date'}
                </div>
                <div className={styles.metaValue}>
                  {activeTab === 'quote' ? currentDoc.expiryDate : currentDoc.dueDate}
                </div>
                <div className={styles.metaSub}>Issued: {currentDoc.issueDate}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className={styles.itemTable}>
              <thead>
                <tr>
                  <th className={styles.itemTh}>Description</th>
                  <th className={styles.itemTh} style={{ textAlign: 'center', width: '80px' }}>Qty</th>
                  <th className={styles.itemTh} style={{ textAlign: 'right', width: '120px' }}>Unit Price</th>
                  <th className={styles.itemTh} style={{ textAlign: 'right', width: '120px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentDoc.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`${styles.itemTd} ${styles.itemTdDesc}`}>{item.desc}</td>
                    <td className={`${styles.itemTd} ${styles.itemTdMono}`} style={{ textAlign: 'center' }}>
                      {item.qty}
                    </td>
                    <td className={`${styles.itemTd} ${styles.itemTdMono}`} style={{ textAlign: 'right' }}>
                      ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`${styles.itemTd} ${styles.itemTdMono}`} style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Workbench Footer Totals */}
            <div className={styles.workbenchFooterRow}>
              <div className={styles.workbenchNotes}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Terms &amp; Notes
                </div>
                <div>{currentDoc.notes}</div>
              </div>

              <div className={styles.workbenchTotals}>
                <div className={styles.totalsLine}>
                  <span>Subtotal:</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                    ${currentDoc.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {currentDoc.discountLabel && (
                  <div className={styles.totalsLine} style={{ color: '#ef4444' }}>
                    <span>{currentDoc.discountLabel}:</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                      -${currentDoc.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className={styles.totalsLine}>
                  <span>{currentDoc.taxLabel}:</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                    ${currentDoc.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className={styles.totalsFinal}>
                  <span>Grand Total:</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                    ${currentDoc.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {currentDoc.balanceDue !== undefined && (
                  <div className={styles.totalsBalance}>
                    <span>Balance Due:</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                      ${currentDoc.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Architecture Section */}
      <section id="architecture" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Core Systems Engine</div>
          <h2 className={styles.sectionTitle}>Built for transactional reliability</h2>
          <p className={styles.sectionDesc}>
            Every layer of QuoteFlow is engineered to eliminate data corruption, duplicate numbering,
            and settlement miscalculations.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Card 1: Sequential Auto-Increment */}
          <div className={`${styles.bentoCard} ${styles.bentoCol8}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIconWrapper}>
                <Lock size={20} />
              </div>
              <h3 className={styles.bentoTitle}>Strict Sequential Number Generator</h3>
              <p className={styles.bentoDesc}>
                Quotations and invoices are automatically allocated monotonic sequence numbers
                governed by PostgreSQL uniqueness constraints. Read-only inputs ensure manual edits
                never disrupt sequential order.
              </p>
            </div>

            <div className={styles.sequenceVisual}>
              <div className={styles.sequenceStep}>
                <span>Profile: QT / INV</span>
              </div>
              <span className={styles.sequenceArrow}>&rarr;</span>
              <div className={styles.sequenceStep}>
                <span>Atomic Lock Check</span>
              </div>
              <span className={styles.sequenceArrow}>&rarr;</span>
              <div className={styles.sequenceStep}>
                <span style={{ color: '#2563eb' }}>Allocated: QT-1001</span>
              </div>
              <span className={styles.sequenceArrow}>&rarr;</span>
              <div className={styles.sequenceStep}>
                <span style={{ color: '#16a34a' }}>Next: QT-1002</span>
              </div>
            </div>
          </div>

          {/* Card 2: 1-Click PDF Stream */}
          <div className={`${styles.bentoCard} ${styles.bentoCol4}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIconWrapper}>
                <Download size={20} />
              </div>
              <h3 className={styles.bentoTitle}>Direct PDF Downloads</h3>
              <p className={styles.bentoDesc}>
                PDFs are generated on the server via streaming PDFKit pipelines with direct
                attachment headers. No browser redirects or print popups.
              </p>
            </div>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'ui-monospace, monospace', color: '#64748b', background: '#f8fafc', padding: '0.75rem', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              Content-Disposition: attachment; filename="Quotation-QT-1001.pdf"
            </div>
          </div>

          {/* Card 3: Status State Machine */}
          <div className={`${styles.bentoCard} ${styles.bentoCol6}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIconWrapper}>
                <RefreshCw size={20} />
              </div>
              <h3 className={styles.bentoTitle}>Live Status State Transitions</h3>
              <p className={styles.bentoDesc}>
                Update document states right from table rows via dedicated atomic PATCH endpoints.
                Watch receivables, overdue alerts, and dashboard tallies update in sync.
              </p>
            </div>

            <div className={styles.statusPipeline}>
              <span className={`${styles.statusPill} ${styles.pillDraft}`}>Draft</span>
              <span>&rarr;</span>
              <span className={`${styles.statusPill} ${styles.pillSent}`}>Sent</span>
              <span>&rarr;</span>
              <span className={`${styles.statusPill} ${styles.pillAccepted}`}>Accepted</span>
              <span>&rarr;</span>
              <span className={`${styles.statusPill} ${styles.pillConverted}`}>Converted</span>
              <span>&rarr;</span>
              <span className={`${styles.statusPill} ${styles.pillPaid}`}>Paid</span>
            </div>
          </div>

          {/* Card 4: Multi-Payment Reconciliation */}
          <div className={`${styles.bentoCard} ${styles.bentoCol6}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIconWrapper}>
                <CreditCard size={20} />
              </div>
              <h3 className={styles.bentoTitle}>Multi-Method Payment Ledger</h3>
              <p className={styles.bentoDesc}>
                Record wire transfers, credit card authorizations, checks, or cash. QuoteFlow
                automatically maintains the exact remaining balance due and handles partial settlements.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', minWidth: '130px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Billed</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', fontFamily: 'ui-monospace, monospace' }}>$9,201.25</div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', minWidth: '130px' }}>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Amount Paid</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16a34a', fontFamily: 'ui-monospace, monospace' }}>$5,000.00</div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem', background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa', minWidth: '130px' }}>
                <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>Balance Due</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ea580c', fontFamily: 'ui-monospace, monospace' }}>$4,201.25</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className={styles.section} style={{ paddingTop: '1rem' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Performance Comparison</div>
          <h2 className={styles.sectionTitle}>Manual templates vs. QuoteFlow</h2>
          <p className={styles.sectionDesc}>
            See how purpose-built billing infrastructure prevents expensive accounting errors.
          </p>
        </div>

        <div className={styles.comparisonCard}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th className={styles.compareTh}>Capability</th>
                <th className={styles.compareTh} style={{ width: '45%' }}>QuoteFlow System</th>
                <th className={styles.compareTh} style={{ width: '35%' }}>Spreadsheets &amp; Word Docs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.compareTd} style={{ fontWeight: 600 }}>Document Numbering</td>
                <td className={`${styles.compareTd} ${styles.compareRowPositive}`}>
                  Automatic sequential allocation with unique database constraints
                </td>
                <td className={`${styles.compareTd} ${styles.compareRowNegative}`}>
                  Manual entry; frequent duplicates &amp; broken sequences
                </td>
              </tr>
              <tr>
                <td className={styles.compareTd} style={{ fontWeight: 600 }}>Quote to Invoice</td>
                <td className={`${styles.compareTd} ${styles.compareRowPositive}`}>
                  One-click conversion copying line items, customer snapshots, &amp; pricing
                </td>
                <td className={`${styles.compareTd} ${styles.compareRowNegative}`}>
                  Copy-pasting rows; high risk of omitted items &amp; price drift
                </td>
              </tr>
              <tr>
                <td className={styles.compareTd} style={{ fontWeight: 600 }}>PDF Generation</td>
                <td className={`${styles.compareTd} ${styles.compareRowPositive}`}>
                  Standardized server-side A4 generation streaming directly to device
                </td>
                <td className={`${styles.compareTd} ${styles.compareRowNegative}`}>
                  Browser print-to-PDF with inconsistent margins &amp; page breaks
                </td>
              </tr>
              <tr>
                <td className={styles.compareTd} style={{ fontWeight: 600 }}>Payment Auditing</td>
                <td className={`${styles.compareTd} ${styles.compareRowPositive}`}>
                  Real-time ledger recording reference numbers, dates, &amp; remaining balances
                </td>
                <td className={`${styles.compareTd} ${styles.compareRowNegative}`}>
                  Untracked notes; untallied overdue receivables
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Solid Slate CTA Box */}
      <section className={styles.section} style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaHeadline}>Ready for reliable client billing?</h2>
          <p className={styles.ctaParagraph}>
            Get your company profile, customers, quotes, and invoices organized in one unified platform.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/register" className={styles.btnCtaWhite}>
              <span>Create Free Account</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/login" className={styles.btnCtaOutline}>
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <img
              src="/quoteflow-icon.svg"
              alt="QuoteFlow Logo"
              style={{ width: 22, height: 22, borderRadius: 4 }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>QuoteFlow</span>
            <span className={styles.footerCopy}>
              &copy; {new Date().getFullYear()} QuoteFlow Inc. All rights reserved.
            </span>
          </div>

          <div className={styles.footerRight}>
            <div className={styles.dbPill}>
              <span className={styles.dbDot} />
              <span>Neon PostgreSQL Connected</span>
            </div>

            <Link to="/login" className={styles.footerNavLink}>
              Sign In
            </Link>
            <Link to="/register" className={styles.footerNavLink}>
              Register
            </Link>
            <a href="#workbench" className={styles.footerNavLink}>
              Demo
            </a>
            <a href="#architecture" className={styles.footerNavLink}>
              Architecture
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
