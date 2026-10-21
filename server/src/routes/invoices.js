import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import { checkValidation } from '../middleware/validate.js';
import { calculateTotals } from './quotations.js';

const router = Router();

router.use(requireAuth);

/**
 * Generate next unique invoice number
 */
async function generateNextInvoiceNumber(userId) {
  let profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: { userId, invoicePrefix: 'INV', nextInvoiceNumber: 1 },
    });
  }

  let nextNum = profile.nextInvoiceNumber || 1;
  let invoiceNumber = `${profile.invoicePrefix || 'INV'}-${String(nextNum).padStart(4, '0')}`;

  while (await prisma.invoice.findUnique({ where: { userId_invoiceNumber: { userId, invoiceNumber } } })) {
    nextNum += 1;
    invoiceNumber = `${profile.invoicePrefix || 'INV'}-${String(nextNum).padStart(4, '0')}`;
  }

  await prisma.companyProfile.update({
    where: { userId },
    data: { nextInvoiceNumber: nextNum + 1 },
  });

  return invoiceNumber;
}

/**
 * GET /api/invoices
 * List all invoices for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, customerId, search } = req.query;

    const where = {
      userId: req.userId,
    };

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      where.OR = [
        { invoiceNumber: { contains: term } },
        { customerName: { contains: term } },
        { customerCompany: { contains: term } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/invoices/:id
 * Retrieve a single invoice with line items and payments
 */
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        customer: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
        quotation: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/invoices
 * Create a new invoice with line items
 */
router.post(
  '/',
  [
    body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required'),
    checkValidation,
  ],
  async (req, res, next) => {
    try {
      const {
        customerId,
        quotationId,
        invoiceNumber: customInvoiceNumber,
        status = 'draft',
        issueDate,
        dueDate,
        currency,
        discountType,
        discountValue,
        taxRate,
        notes,
        paymentTerms,
        lineItems = [],
        customerName: directCustomerName,
        customerCompany: directCustomerCompany,
        customerEmail: directCustomerEmail,
        customerAddress: directCustomerAddress,
      } = req.body;

      // 1. Fetch Company Profile
      const company = await prisma.companyProfile.findUnique({
        where: { userId: req.userId },
      });

      // 2. Resolve Customer Snapshot
      let snapCustomerName = directCustomerName || '';
      let snapCustomerCompany = directCustomerCompany || '';
      let snapCustomerEmail = directCustomerEmail || '';
      let snapCustomerAddress = directCustomerAddress || '';

      if (customerId) {
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, userId: req.userId },
        });
        if (customer) {
          snapCustomerName = customer.name;
          snapCustomerCompany = customer.company || snapCustomerCompany;
          snapCustomerEmail = customer.email || snapCustomerEmail;
          snapCustomerAddress = [
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
            customer.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      }

      // 3. Resolve Invoice Number
      let finalInvoiceNumber = customInvoiceNumber?.trim();
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = await generateNextInvoiceNumber(req.userId);
      } else {
        const existing = await prisma.invoice.findUnique({
          where: { userId_invoiceNumber: { userId: req.userId, invoiceNumber: finalInvoiceNumber } },
        });
        if (existing) {
          finalInvoiceNumber = await generateNextInvoiceNumber(req.userId);
        } else {
          const prefix = company?.invoicePrefix || 'INV';
          const match = finalInvoiceNumber.match(new RegExp(`^${prefix}-(\\d+)$`));
          if (match) {
            const numVal = parseInt(match[1], 10);
            if (numVal >= (company?.nextInvoiceNumber || 1)) {
              await prisma.companyProfile.update({
                where: { userId: req.userId },
                data: { nextInvoiceNumber: numVal + 1 },
              });
            }
          }
        }
      }

      // 4. Calculate Totals
      const calculation = calculateTotals({
        lineItems,
        discountType,
        discountValue,
        taxRate: taxRate !== undefined ? taxRate : (company?.defaultTaxRate || 0),
      });

      const total = calculation.total;
      const amountPaid = 0;
      const balanceDue = total;

      // Default dueDate to 30 days after issueDate if not specified
      const parsedIssueDate = issueDate ? new Date(issueDate) : new Date();
      let parsedDueDate = dueDate ? new Date(dueDate) : null;
      if (!parsedDueDate) {
        parsedDueDate = new Date(parsedIssueDate);
        parsedDueDate.setDate(parsedDueDate.getDate() + 30);
      }

      // 5. Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          userId: req.userId,
          customerId: customerId || null,
          quotationId: quotationId || null,
          invoiceNumber: finalInvoiceNumber,
          status,
          issueDate: parsedIssueDate,
          dueDate: parsedDueDate,
          currency: (currency || company?.defaultCurrency || 'USD').toUpperCase(),

          customerName: snapCustomerName,
          customerCompany: snapCustomerCompany,
          customerEmail: snapCustomerEmail,
          customerAddress: snapCustomerAddress,

          companyName: company?.companyName || '',
          companyEmail: company?.email || '',
          companyPhone: company?.phone || '',
          companyAddress: [company?.address, company?.city, company?.state, company?.zipCode, company?.country]
            .filter(Boolean)
            .join(', '),
          companyWebsite: company?.website || '',
          companyLogoUrl: company?.logoUrl || '',

          subtotal: calculation.subtotal,
          discountType: calculation.discountType,
          discountValue: calculation.discountValue,
          discountAmount: calculation.discountAmount,
          taxRate: calculation.taxRate,
          taxAmount: calculation.taxAmount,
          total,
          amountPaid,
          balanceDue,

          notes: notes !== undefined ? notes : (company?.defaultNotes || ''),
          paymentTerms: paymentTerms !== undefined ? paymentTerms : (company?.defaultPaymentTerms || ''),

          lineItems: {
            create: calculation.lineItems,
          },
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          payments: true,
          customer: true,
        },
      });

      res.status(201).json({
        success: true,
        invoice,
        message: 'Invoice created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/invoices/:id
 * Update invoice, line items, and recalculate balance
 */
router.put('/:id', async (req, res, next) => {
  try {
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        lineItems: true,
        payments: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    const {
      customerId,
      invoiceNumber,
      status,
      issueDate,
      dueDate,
      currency,
      discountType = existingInvoice.discountType,
      discountValue = existingInvoice.discountValue,
      taxRate = existingInvoice.taxRate,
      notes,
      paymentTerms,
      lineItems,
      customerName,
      customerCompany,
      customerEmail,
      customerAddress,
    } = req.body;

    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      const collision = await prisma.invoice.findUnique({
        where: { userId_invoiceNumber: { userId: req.userId, invoiceNumber: invoiceNumber.trim() } },
      });
      if (collision) {
        return res.status(409).json({
          success: false,
          error: `Invoice number "${invoiceNumber}" is already in use.`,
        });
      }
    }

    const itemsToCalculate = lineItems || existingInvoice.lineItems;
    const calculation = calculateTotals({
      lineItems: itemsToCalculate,
      discountType,
      discountValue,
      taxRate,
    });

    // Sum existing payments
    const totalPayments = existingInvoice.payments.reduce((acc, p) => acc + p.amount, 0);
    const amountPaid = Math.round(totalPayments * 100) / 100;
    const balanceDue = Math.max(0, Math.round((calculation.total - amountPaid) * 100) / 100);

    // Auto-update status if not explicitly specified and payment state changed
    let finalStatus = status || existingInvoice.status;
    if (!status) {
      if (balanceDue <= 0 && calculation.total > 0) {
        finalStatus = 'paid';
      } else if (amountPaid > 0) {
        finalStatus = 'partially_paid';
      }
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      if (lineItems) {
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: req.params.id },
        });

        await tx.invoiceLineItem.createMany({
          data: calculation.lineItems.map((item) => ({
            ...item,
            invoiceId: req.params.id,
          })),
        });
      }

      return await tx.invoice.update({
        where: { id: req.params.id },
        data: {
          ...(customerId !== undefined && { customerId: customerId || null }),
          ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber.trim() }),
          status: finalStatus,
          ...(issueDate !== undefined && { issueDate: new Date(issueDate) }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(currency !== undefined && { currency: currency.toUpperCase() }),
          ...(customerName !== undefined && { customerName }),
          ...(customerCompany !== undefined && { customerCompany }),
          ...(customerEmail !== undefined && { customerEmail }),
          ...(customerAddress !== undefined && { customerAddress }),
          subtotal: calculation.subtotal,
          discountType: calculation.discountType,
          discountValue: calculation.discountValue,
          discountAmount: calculation.discountAmount,
          taxRate: calculation.taxRate,
          taxAmount: calculation.taxAmount,
          total: calculation.total,
          amountPaid,
          balanceDue,
          ...(notes !== undefined && { notes }),
          ...(paymentTerms !== undefined && { paymentTerms }),
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          payments: {
            orderBy: { date: 'desc' },
          },
          customer: true,
        },
      });
    });

    res.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/invoices/:id/status
 * Update only the status of an invoice
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        customer: {
          select: { id: true, name: true, company: true, email: true },
        },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    res.json({
      success: true,
      invoice: updated,
      message: `Invoice status updated to "${status}"`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
