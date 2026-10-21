import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUserData(user) {
  console.log(`\n--- Seeding data for ${user.email} (${user.id}) ---`);

  // 1. Ensure / update Company Profile
  await prisma.companyProfile.upsert({
    where: { userId: user.id },
    update: {
      companyName: 'Nexus Digital Technologies LLC',
      email: 'billing@nexusdigital.io',
      phone: '+1 (555) 349-8821',
      website: 'https://nexusdigital.io',
      address: '742 Evergreen Terrace, Suite 300',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'United States',
      taxId: 'US-94-3829104',
      logoUrl: '/quoteflow-icon.svg',
      defaultCurrency: 'USD',
      defaultPaymentTerms: 'Payment due within 30 days of invoice date. Late payments subject to 1.5% monthly fee.',
      defaultTaxRate: 8.25,
      defaultNotes: 'Thank you for choosing Nexus Digital Technologies. We appreciate your business!',
      quotePrefix: 'QT',
      invoicePrefix: 'INV',
      nextQuoteNumber: 1008,
      nextInvoiceNumber: 1008,
    },
    create: {
      userId: user.id,
      companyName: 'Nexus Digital Technologies LLC',
      email: 'billing@nexusdigital.io',
      phone: '+1 (555) 349-8821',
      website: 'https://nexusdigital.io',
      address: '742 Evergreen Terrace, Suite 300',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'United States',
      taxId: 'US-94-3829104',
      logoUrl: '/quoteflow-icon.svg',
      defaultCurrency: 'USD',
      defaultPaymentTerms: 'Payment due within 30 days of invoice date. Late payments subject to 1.5% monthly fee.',
      defaultTaxRate: 8.25,
      defaultNotes: 'Thank you for choosing Nexus Digital Technologies. We appreciate your business!',
      quotePrefix: 'QT',
      invoicePrefix: 'INV',
      nextQuoteNumber: 1008,
      nextInvoiceNumber: 1008,
    },
  });

  // 2. Clear old test/demo documents for clean idempotent state
  await prisma.payment.deleteMany({ where: { invoice: { userId: user.id } } });
  await prisma.invoiceLineItem.deleteMany({ where: { invoice: { userId: user.id } } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.quotationLineItem.deleteMany({ where: { quotation: { userId: user.id } } });
  await prisma.quotation.deleteMany({ where: { userId: user.id } });
  await prisma.customer.deleteMany({ where: { userId: user.id } });

  // 3. Create Customers
  const customerAcme = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'Sarah Jenkins',
      company: 'Acme Innovations Inc.',
      email: 'sarah.j@acmeinnovations.com',
      phone: '+1 (555) 234-5678',
      address: '1200 Innovation Way',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'United States',
      notes: 'Strategic hardware & IoT client. Prefers monthly billing summaries.',
    },
  });

  const customerStarlight = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'Marcus Vance',
      company: 'Starlight Media & Entertainment',
      email: 'm.vance@starlightmedia.co',
      phone: '+1 (555) 876-5432',
      address: '450 Sunset Blvd, Suite 210',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90028',
      country: 'United States',
      notes: 'Creative production agency. Fast turnaround on UI/UX assets required.',
    },
  });

  const customerVanguard = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'Eleanor Hughes',
      company: 'Vanguard Financial Advisory',
      email: 'eleanor@vanguard-advisory.com',
      phone: '+1 (555) 345-6789',
      address: '100 Wall Street, 18th Floor',
      city: 'New York',
      state: 'NY',
      zipCode: '10005',
      country: 'United States',
      notes: 'Institutional fintech advisory. Strict compliance and audit trails.',
    },
  });

  const customerBioGenix = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'Dr. Liam Patel',
      company: 'BioGenix Healthcare Labs',
      email: 'liam.patel@biogenixlabs.org',
      phone: '+1 (555) 987-6543',
      address: '75 Cambridge Parkway',
      city: 'Boston',
      state: 'MA',
      zipCode: '02142',
      country: 'United States',
      notes: 'Clinical diagnostics platform. HIPAA-compliant infrastructure partner.',
    },
  });

  const customerEcoSphere = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'Chloe Zhang',
      company: 'EcoSphere Sustainable Goods',
      email: 'chloe@ecospheregoods.com',
      phone: '+1 (555) 456-7890',
      address: '880 Market St, Floor 4',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'United States',
      notes: 'Direct-to-consumer e-commerce brand specializing in carbon-neutral goods.',
    },
  });

  const customerHorizon = await prisma.customer.create({
    data: {
      userId: user.id,
      name: 'David Miller',
      company: 'Horizon Cloud Systems',
      email: 'david@horizoncloud.net',
      phone: '+1 (555) 654-3210',
      address: '300 Boulder Ridge Dr',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
      country: 'United States',
      notes: 'High-availability Kubernetes and multi-cloud solutions.',
    },
  });

  console.log(`Created 6 customers.`);

  // Company snapshot info
  const compInfo = {
    companyName: 'Nexus Digital Technologies LLC',
    companyEmail: 'billing@nexusdigital.io',
    companyPhone: '+1 (555) 349-8821',
    companyAddress: '742 Evergreen Terrace, Suite 300, Springfield, IL 62704',
    companyWebsite: 'https://nexusdigital.io',
    companyLogoUrl: '/quoteflow-icon.svg',
  };

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  // 4. Create Quotations (Covering all statuses: accepted, sent, draft, rejected, expired, converted)
  const q1 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerBioGenix.id,
      quoteNumber: 'QT-1001',
      status: 'accepted',
      issueDate: new Date(now.getTime() - 10 * day),
      expiryDate: new Date(now.getTime() + 20 * day),
      currency: 'USD',
      customerName: customerBioGenix.name,
      customerCompany: customerBioGenix.company,
      customerEmail: customerBioGenix.email,
      customerAddress: `${customerBioGenix.address}, ${customerBioGenix.city}, ${customerBioGenix.state}`,
      ...compInfo,
      subtotal: 8500.0,
      discountType: 'percentage',
      discountValue: 5,
      discountAmount: 425.0,
      taxRate: 8.25,
      taxAmount: 666.19,
      total: 8741.19,
      notes: 'Includes full documentation and 30-day post-launch warranty.',
      paymentTerms: '50% upon contract signing, 50% upon final acceptance.',
      lineItems: {
        create: [
          { description: 'Patient Portal UI/UX Redesign', quantity: 1, unitPrice: 4500.0, amount: 4500.0, sortOrder: 0 },
          { description: 'HIPAA-Compliant REST API Integration', quantity: 1, unitPrice: 3000.0, amount: 3000.0, sortOrder: 1 },
          { description: 'Automated End-to-End Test Suite', quantity: 1, unitPrice: 1000.0, amount: 1000.0, sortOrder: 2 },
        ],
      },
    },
  });

  const q2 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerVanguard.id,
      quoteNumber: 'QT-1002',
      status: 'sent',
      issueDate: new Date(now.getTime() - 3 * day),
      expiryDate: new Date(now.getTime() + 27 * day),
      currency: 'USD',
      customerName: customerVanguard.name,
      customerCompany: customerVanguard.company,
      customerEmail: customerVanguard.email,
      customerAddress: `${customerVanguard.address}, ${customerVanguard.city}, ${customerVanguard.state}`,
      ...compInfo,
      subtotal: 14200.0,
      discountType: 'fixed',
      discountValue: 1000.0,
      discountAmount: 1000.0,
      taxRate: 8.25,
      taxAmount: 1089.0,
      total: 14289.0,
      notes: 'Real-time telemetry and algorithmic trade monitoring dashboard.',
      paymentTerms: 'Net 30 days upon delivery of staging environment.',
      lineItems: {
        create: [
          { description: 'High-Frequency Realtime WebSocket Feeds', quantity: 1, unitPrice: 6200.0, amount: 6200.0, sortOrder: 0 },
          { description: 'Interactive Trading Analytics Charts (TradingView/D3)', quantity: 1, unitPrice: 5000.0, amount: 5000.0, sortOrder: 1 },
          { description: 'Role-Based Access Control & MFA Module', quantity: 1, unitPrice: 3000.0, amount: 3000.0, sortOrder: 2 },
        ],
      },
    },
  });

  const q3 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerEcoSphere.id,
      quoteNumber: 'QT-1003',
      status: 'draft',
      issueDate: new Date(),
      expiryDate: new Date(now.getTime() + 14 * day),
      currency: 'USD',
      customerName: customerEcoSphere.name,
      customerCompany: customerEcoSphere.company,
      customerEmail: customerEcoSphere.email,
      customerAddress: `${customerEcoSphere.address}, ${customerEcoSphere.city}, ${customerEcoSphere.state}`,
      ...compInfo,
      subtotal: 6400.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 528.0,
      total: 6928.0,
      notes: 'Exploratory estimate for Next.js e-commerce storefront migration.',
      paymentTerms: 'Draft estimate - subject to scope refinement.',
      lineItems: {
        create: [
          { description: 'Next.js 14 Headless Commerce Architecture', quantity: 1, unitPrice: 3800.0, amount: 3800.0, sortOrder: 0 },
          { description: 'Shopify Storefront GraphQL Integration', quantity: 1, unitPrice: 2600.0, amount: 2600.0, sortOrder: 1 },
        ],
      },
    },
  });

  const q4 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerAcme.id,
      quoteNumber: 'QT-1004',
      status: 'rejected',
      issueDate: new Date(now.getTime() - 45 * day),
      expiryDate: new Date(now.getTime() - 15 * day),
      currency: 'USD',
      customerName: customerAcme.name,
      customerCompany: customerAcme.company,
      customerEmail: customerAcme.email,
      customerAddress: `${customerAcme.address}, ${customerAcme.city}, ${customerAcme.state}`,
      ...compInfo,
      subtotal: 3800.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 313.5,
      total: 4113.5,
      notes: 'Client decided to defer on-premise database migration to Q4.',
      paymentTerms: 'Due upon completion.',
      lineItems: {
        create: [
          { description: 'PostgreSQL Schema Normalization & Performance Tuning', quantity: 1, unitPrice: 2400.0, amount: 2400.0, sortOrder: 0 },
          { description: 'Data Pipeline Zero-Downtime Migration Script', quantity: 1, unitPrice: 1400.0, amount: 1400.0, sortOrder: 1 },
        ],
      },
    },
  });

  const q5 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerStarlight.id,
      quoteNumber: 'QT-1005',
      status: 'expired',
      issueDate: new Date(now.getTime() - 60 * day),
      expiryDate: new Date(now.getTime() - 30 * day),
      currency: 'USD',
      customerName: customerStarlight.name,
      customerCompany: customerStarlight.company,
      customerEmail: customerStarlight.email,
      customerAddress: `${customerStarlight.address}, ${customerStarlight.city}, ${customerStarlight.state}`,
      ...compInfo,
      subtotal: 18500.0,
      discountType: 'percentage',
      discountValue: 10,
      discountAmount: 1850.0,
      taxRate: 8.25,
      taxAmount: 1373.63,
      total: 18023.63,
      notes: 'Validity period elapsed without client confirmation.',
      paymentTerms: '30-day payment term.',
      lineItems: {
        create: [
          { description: 'Global CDN Multi-Region Video Transcoding Cluster', quantity: 1, unitPrice: 12500.0, amount: 12500.0, sortOrder: 0 },
          { description: 'Low-Latency HLS/DASH Streaming Player Framework', quantity: 1, unitPrice: 6000.0, amount: 6000.0, sortOrder: 1 },
        ],
      },
    },
  });

  const q6 = await prisma.quotation.create({
    data: {
      userId: user.id,
      customerId: customerHorizon.id,
      quoteNumber: 'QT-1006',
      status: 'converted',
      issueDate: new Date(now.getTime() - 25 * day),
      expiryDate: new Date(now.getTime() + 5 * day),
      currency: 'USD',
      customerName: customerHorizon.name,
      customerCompany: customerHorizon.company,
      customerEmail: customerHorizon.email,
      customerAddress: `${customerHorizon.address}, ${customerHorizon.city}, ${customerHorizon.state}`,
      ...compInfo,
      subtotal: 11000.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 907.5,
      total: 11907.5,
      notes: 'Successfully accepted and converted to Invoice #INV-1001.',
      paymentTerms: 'Net 30 days.',
      lineItems: {
        create: [
          { description: 'Kubernetes Cluster Hardening & CIS Benchmark Audit', quantity: 1, unitPrice: 6500.0, amount: 6500.0, sortOrder: 0 },
          { description: 'Cloud Penetration Testing & Vulnerability Remediation', quantity: 1, unitPrice: 4500.0, amount: 4500.0, sortOrder: 1 },
        ],
      },
    },
  });

  console.log(`Created 6 quotations.`);

  // 5. Create Invoices (Covering all statuses: paid, partially_paid, unpaid, overdue, sent, draft, cancelled)

  // INV-1001: Converted from QT-1006, Fully Paid
  const inv1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerHorizon.id,
      quotationId: q6.id,
      invoiceNumber: 'INV-1001',
      status: 'paid',
      issueDate: new Date(now.getTime() - 20 * day),
      dueDate: new Date(now.getTime() + 10 * day),
      currency: 'USD',
      customerName: customerHorizon.name,
      customerCompany: customerHorizon.company,
      customerEmail: customerHorizon.email,
      customerAddress: `${customerHorizon.address}, ${customerHorizon.city}, ${customerHorizon.state}`,
      ...compInfo,
      subtotal: 11000.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 907.5,
      total: 11907.5,
      amountPaid: 11907.5,
      balanceDue: 0.0,
      notes: 'Thank you for your prompt settlement of this invoice!',
      paymentTerms: 'Payment due within 30 days via Wire or ACH.',
      lineItems: {
        create: [
          { description: 'Kubernetes Cluster Hardening & CIS Benchmark Audit', quantity: 1, unitPrice: 6500.0, amount: 6500.0, sortOrder: 0 },
          { description: 'Cloud Penetration Testing & Vulnerability Remediation', quantity: 1, unitPrice: 4500.0, amount: 4500.0, sortOrder: 1 },
        ],
      },
      payments: {
        create: [
          { amount: 5000.0, date: new Date(now.getTime() - 15 * day), method: 'Bank Transfer', reference: 'ACH-498219', notes: 'Initial 50% milestone settlement.' },
          { amount: 6907.5, date: new Date(now.getTime() - 5 * day), method: 'Bank Transfer', reference: 'WIRE-773412', notes: 'Final project completion payment.' },
        ],
      },
    },
  });

  // INV-1002: Partially Paid
  const inv2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerBioGenix.id,
      invoiceNumber: 'INV-1002',
      status: 'partially_paid',
      issueDate: new Date(now.getTime() - 12 * day),
      dueDate: new Date(now.getTime() + 18 * day),
      currency: 'USD',
      customerName: customerBioGenix.name,
      customerCompany: customerBioGenix.company,
      customerEmail: customerBioGenix.email,
      customerAddress: `${customerBioGenix.address}, ${customerBioGenix.city}, ${customerBioGenix.state}`,
      ...compInfo,
      subtotal: 8500.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 701.25,
      total: 9201.25,
      amountPaid: 5000.0,
      balanceDue: 4201.25,
      notes: 'Phase 1 portal development deliverables approved.',
      paymentTerms: '50% upon contract signing, remaining balance upon final delivery.',
      lineItems: {
        create: [
          { description: 'Patient Portal UI/UX Redesign Deliverables', quantity: 1, unitPrice: 5000.0, amount: 5000.0, sortOrder: 0 },
          { description: 'HIPAA-Compliant Security & Database Encryption', quantity: 1, unitPrice: 3500.0, amount: 3500.0, sortOrder: 1 },
        ],
      },
      payments: {
        create: [
          { amount: 5000.0, date: new Date(now.getTime() - 8 * day), method: 'Credit Card', reference: 'STRIPE-CHG-99321', notes: 'Phase 1 kickoff deposit.' },
        ],
      },
    },
  });

  // INV-1003: Unpaid / Sent
  const inv3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerVanguard.id,
      invoiceNumber: 'INV-1003',
      status: 'sent',
      issueDate: new Date(now.getTime() - 4 * day),
      dueDate: new Date(now.getTime() + 26 * day),
      currency: 'USD',
      customerName: customerVanguard.name,
      customerCompany: customerVanguard.company,
      customerEmail: customerVanguard.email,
      customerAddress: `${customerVanguard.address}, ${customerVanguard.city}, ${customerVanguard.state}`,
      ...compInfo,
      subtotal: 7500.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 618.75,
      total: 8118.75,
      amountPaid: 0,
      balanceDue: 8118.75,
      notes: 'Monthly advisory engineering retainer for Q3.',
      paymentTerms: 'Net 30 days via Wire Transfer.',
      lineItems: {
        create: [
          { description: 'Dedicated Senior Full-Stack Engineering Support (80 hrs)', quantity: 80, unitPrice: 75.0, amount: 6000.0, sortOrder: 0 },
          { description: 'Cloud Infrastructure Monitoring & On-Call SLA', quantity: 1, unitPrice: 1500.0, amount: 1500.0, sortOrder: 1 },
        ],
      },
    },
  });

  // INV-1004: Overdue
  const inv4 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerStarlight.id,
      invoiceNumber: 'INV-1004',
      status: 'overdue',
      issueDate: new Date(now.getTime() - 45 * day),
      dueDate: new Date(now.getTime() - 15 * day),
      currency: 'USD',
      customerName: customerStarlight.name,
      customerCompany: customerStarlight.company,
      customerEmail: customerStarlight.email,
      customerAddress: `${customerStarlight.address}, ${customerStarlight.city}, ${customerStarlight.state}`,
      ...compInfo,
      subtotal: 4500.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 371.25,
      total: 4871.25,
      amountPaid: 0,
      balanceDue: 4871.25,
      notes: 'OVERDUE: Payment past due date of 15 days. Please settle immediately.',
      paymentTerms: 'Payment was due within 30 days of invoice date.',
      lineItems: {
        create: [
          { description: 'Video Stream Encoding & Transcoding Pipeline Optimization', quantity: 1, unitPrice: 3000.0, amount: 3000.0, sortOrder: 0 },
          { description: 'Custom Analytics Dashboard for Viewership Metrics', quantity: 1, unitPrice: 1500.0, amount: 1500.0, sortOrder: 1 },
        ],
      },
    },
  });

  // INV-1005: Draft
  const inv5 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerEcoSphere.id,
      invoiceNumber: 'INV-1005',
      status: 'draft',
      issueDate: new Date(),
      dueDate: new Date(now.getTime() + 30 * day),
      currency: 'USD',
      customerName: customerEcoSphere.name,
      customerCompany: customerEcoSphere.company,
      customerEmail: customerEcoSphere.email,
      customerAddress: `${customerEcoSphere.address}, ${customerEcoSphere.city}, ${customerEcoSphere.state}`,
      ...compInfo,
      subtotal: 3200.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 264.0,
      total: 3464.0,
      amountPaid: 0,
      balanceDue: 3464.0,
      notes: 'Draft bill for warehouse inventory API connector.',
      paymentTerms: 'Payment due within 30 days.',
      lineItems: {
        create: [
          { description: 'ERP to Shopify Real-Time Inventory Sync Service', quantity: 1, unitPrice: 3200.0, amount: 3200.0, sortOrder: 0 },
        ],
      },
    },
  });

  // INV-1006: Fully Paid
  const inv6 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerAcme.id,
      invoiceNumber: 'INV-1006',
      status: 'paid',
      issueDate: new Date(now.getTime() - 35 * day),
      dueDate: new Date(now.getTime() - 5 * day),
      currency: 'USD',
      customerName: customerAcme.name,
      customerCompany: customerAcme.company,
      customerEmail: customerAcme.email,
      customerAddress: `${customerAcme.address}, ${customerAcme.city}, ${customerAcme.state}`,
      ...compInfo,
      subtotal: 5000.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 412.5,
      total: 5412.5,
      amountPaid: 5412.5,
      balanceDue: 0,
      notes: 'Thank you for your business!',
      paymentTerms: 'Payment due within 30 days.',
      lineItems: {
        create: [
          { description: 'Quarterly Technical Architecture Review & Cloud Strategy', quantity: 1, unitPrice: 5000.0, amount: 5000.0, sortOrder: 0 },
        ],
      },
      payments: {
        create: [
          { amount: 5412.5, date: new Date(now.getTime() - 10 * day), method: 'Credit Card', reference: 'CC-AUTH-884102', notes: 'Paid online via portal.' },
        ],
      },
    },
  });

  // INV-1007: Cancelled
  const inv7 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customerHorizon.id,
      invoiceNumber: 'INV-1007',
      status: 'cancelled',
      issueDate: new Date(now.getTime() - 50 * day),
      dueDate: new Date(now.getTime() - 20 * day),
      currency: 'USD',
      customerName: customerHorizon.name,
      customerCompany: customerHorizon.company,
      customerEmail: customerHorizon.email,
      customerAddress: `${customerHorizon.address}, ${customerHorizon.city}, ${customerHorizon.state}`,
      ...compInfo,
      subtotal: 2500.0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 8.25,
      taxAmount: 206.25,
      total: 2706.25,
      amountPaid: 0,
      balanceDue: 2706.25,
      notes: 'Cancelled due to project cancellation and scope consolidation into INV-1001.',
      paymentTerms: 'Void / Cancelled.',
      lineItems: {
        create: [
          { description: 'Deprecated Proof of Concept Prototype Sandbox', quantity: 1, unitPrice: 2500.0, amount: 2500.0, sortOrder: 0 },
        ],
      },
    },
  });

  console.log(`Created 7 invoices with recorded payments.`);
}

async function main() {
  console.log('Seeding QuoteFlow database with rich realistic dummy data...');

  // 1. Create or get Demo User (demo@quoteflow.com)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@quoteflow.com' },
    update: {},
    create: {
      email: 'demo@quoteflow.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Morgan',
    },
  });

  // Seed data for all registered users in the database so any login has data
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    await seedUserData(user);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY!');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
