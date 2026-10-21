import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import { checkValidation } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * Helper to calculate subtotal, discount, tax, and total
 */
export function calculateTotals({ lineItems = [], discountType = 'percentage', discountValue = 0, taxRate = 0 }) {
  const normalizedItems = lineItems.map((item, index) => {
    const quantity = Math.max(0, parseFloat(item.quantity) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    return {
      description: item.description?.trim() || 'Item',
      quantity,
      unitPrice,
      amount,
      sortOrder: item.sortOrder !== undefined ? parseInt(item.sortOrder, 10) : index,
    };
  });

  const subtotal = Math.round(normalizedItems.reduce((acc, item) => acc + item.amount, 0) * 100) / 100;

  const validDiscountType = discountType === 'fixed' ? 'fixed' : 'percentage';
  const numDiscountValue = Math.max(0, parseFloat(discountValue) || 0);
  let discountAmount = 0;

  if (validDiscountType === 'percentage') {
    discountAmount = Math.round((subtotal * (numDiscountValue / 100)) * 100) / 100;
  } else {
    discountAmount = Math.min(subtotal, Math.round(numDiscountValue * 100) / 100);
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const numTaxRate = Math.max(0, parseFloat(taxRate) || 0);
  const taxAmount = Math.round((taxableBase * (numTaxRate / 100)) * 100) / 100;
  const total = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    lineItems: normalizedItems,
    subtotal,
    discountType: validDiscountType,
    discountValue: numDiscountValue,
    discountAmount,
    taxRate: numTaxRate,
    taxAmount,
    total,
  };
}

/**
 * Generate next document number safely
 */
async function generateNextQuoteNumber(userId) {
  let profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: { userId, quotePrefix: 'QT', nextQuoteNumber: 1 },
    });
  }

  let nextNum = profile.nextQuoteNumber || 1;
  let quoteNumber = `${profile.quotePrefix || 'QT'}-${String(nextNum).padStart(4, '0')}`;

  // Ensure uniqueness
  while (await prisma.quotation.findUnique({ where: { userId_quoteNumber: { userId, quoteNumber } } })) {
    nextNum += 1;
    quoteNumber = `${profile.quotePrefix || 'QT'}-${String(nextNum).padStart(4, '0')}`;
  }

  // Update profile with incremented next number
  await prisma.companyProfile.update({
    where: { userId },
    data: { nextQuoteNumber: nextNum + 1 },
  });

  return quoteNumber;
}

/**
 * GET /api/quotations
 * List all quotations with customer and line items summary
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const where = {
      userId: req.userId,
    };

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      where.OR = [
        { quoteNumber: { contains: term } },
        { customerName: { contains: term } },
        { customerCompany: { contains: term } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
    });

    res.json({
      success: true,
      quotations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id
 * Retrieve a single quotation by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        customer: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            balanceDue: true,
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    res.json({
      success: true,
      quotation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations
 * Create a new quotation with line items
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
        quoteNumber: customQuoteNumber,
        status = 'draft',
        issueDate,
        expiryDate,
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

      // 1. Fetch Company Profile for snapshots & defaults
      const company = await prisma.companyProfile.findUnique({
        where: { userId: req.userId },
      });

      // 2. Resolve customer information snapshot
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

      // 3. Resolve Quote Number
      let finalQuoteNumber = customQuoteNumber?.trim();
      if (!finalQuoteNumber) {
        finalQuoteNumber = await generateNextQuoteNumber(req.userId);
      } else {
        const existing = await prisma.quotation.findUnique({
          where: { userId_quoteNumber: { userId: req.userId, quoteNumber: finalQuoteNumber } },
        });
        if (existing) {
          finalQuoteNumber = await generateNextQuoteNumber(req.userId);
        } else {
          const prefix = company?.quotePrefix || 'QT';
          const match = finalQuoteNumber.match(new RegExp(`^${prefix}-(\\d+)$`));
          if (match) {
            const numVal = parseInt(match[1], 10);
            if (numVal >= (company?.nextQuoteNumber || 1)) {
              await prisma.companyProfile.update({
                where: { userId: req.userId },
                data: { nextQuoteNumber: numVal + 1 },
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

      // 5. Create quotation record
      const quotation = await prisma.quotation.create({
        data: {
          userId: req.userId,
          customerId: customerId || null,
          quoteNumber: finalQuoteNumber,
          status,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
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
          total: calculation.total,

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
          customer: true,
        },
      });

      res.status(201).json({
        success: true,
        quotation,
        message: 'Quotation created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/quotations/:id
 * Update quotation and line items
 */
router.put('/:id', async (req, res, next) => {
  try {
    const existingQuotation = await prisma.quotation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        lineItems: true,
      },
    });

    if (!existingQuotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    const {
      customerId,
      quoteNumber,
      status,
      issueDate,
      expiryDate,
      currency,
      discountType = existingQuotation.discountType,
      discountValue = existingQuotation.discountValue,
      taxRate = existingQuotation.taxRate,
      notes,
      paymentTerms,
      lineItems,
      customerName,
      customerCompany,
      customerEmail,
      customerAddress,
    } = req.body;

    // Check unique quoteNumber if changed
    if (quoteNumber && quoteNumber !== existingQuotation.quoteNumber) {
      const collision = await prisma.quotation.findUnique({
        where: { userId_quoteNumber: { userId: req.userId, quoteNumber: quoteNumber.trim() } },
      });
      if (collision) {
        return res.status(409).json({
          success: false,
          error: `Quotation number "${quoteNumber}" is already in use.`,
        });
      }
    }

    const itemsToCalculate = lineItems || existingQuotation.lineItems;
    const calculation = calculateTotals({
      lineItems: itemsToCalculate,
      discountType,
      discountValue,
      taxRate,
    });

    // Update inside a transaction to ensure line items consistency
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      if (lineItems) {
        await tx.quotationLineItem.deleteMany({
          where: { quotationId: req.params.id },
        });

        await tx.quotationLineItem.createMany({
          data: calculation.lineItems.map((item) => ({
            ...item,
            quotationId: req.params.id,
          })),
        });
      }

      return await tx.quotation.update({
        where: { id: req.params.id },
        data: {
          ...(customerId !== undefined && { customerId: customerId || null }),
          ...(quoteNumber !== undefined && { quoteNumber: quoteNumber.trim() }),
          ...(status !== undefined && { status }),
          ...(issueDate !== undefined && { issueDate: new Date(issueDate) }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
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
          ...(notes !== undefined && { notes }),
          ...(paymentTerms !== undefined && { paymentTerms }),
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          customer: true,
          invoice: true,
        },
      });
    });

    res.json({
      success: true,
      quotation: updatedQuotation,
      message: 'Quotation updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/quotations/:id/status
 * Update only the status of a quotation
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        customer: {
          select: { id: true, name: true, company: true, email: true },
        },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });

    res.json({
      success: true,
      quotation: updated,
      message: `Quotation status updated to "${status}"`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/quotations/:id
 * Delete a quotation
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        invoice: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    if (quotation.invoice) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete quotation converted to invoice #${quotation.invoice.invoiceNumber}. Please delete the invoice first.`,
      });
    }

    await prisma.quotation.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/:id/convert
 * Convert quotation to invoice
 */
router.post('/:id/convert', async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        invoice: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    if (quotation.invoice) {
      return res.status(400).json({
        success: false,
        error: `This quotation has already been converted to Invoice #${quotation.invoice.invoiceNumber}.`,
      });
    }

    // Generate invoice number
    let company = await prisma.companyProfile.findUnique({
      where: { userId: req.userId },
    });
    if (!company) {
      company = await prisma.companyProfile.create({
        data: { userId: req.userId },
      });
    }

    let nextInvNum = company.nextInvoiceNumber || 1;
    let invoiceNumber = `${company.invoicePrefix || 'INV'}-${String(nextInvNum).padStart(4, '0')}`;

    while (await prisma.invoice.findUnique({ where: { userId_invoiceNumber: { userId: req.userId, invoiceNumber } } })) {
      nextInvNum += 1;
      invoiceNumber = `${company.invoicePrefix || 'INV'}-${String(nextInvNum).padStart(4, '0')}`;
    }

    await prisma.companyProfile.update({
      where: { userId: req.userId },
      data: { nextInvoiceNumber: nextInvNum + 1 },
    });

    // Create Invoice and update Quotation status inside transaction
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default 30-day payment term

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          userId: req.userId,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          invoiceNumber,
          status: 'sent',
          issueDate: new Date(),
          dueDate,
          currency: quotation.currency,

          customerName: quotation.customerName,
          customerCompany: quotation.customerCompany,
          customerEmail: quotation.customerEmail,
          customerAddress: quotation.customerAddress,

          companyName: quotation.companyName,
          companyEmail: quotation.companyEmail,
          companyPhone: quotation.companyPhone,
          companyAddress: quotation.companyAddress,
          companyWebsite: quotation.companyWebsite,
          companyLogoUrl: quotation.companyLogoUrl,

          subtotal: quotation.subtotal,
          discountType: quotation.discountType,
          discountValue: quotation.discountValue,
          discountAmount: quotation.discountAmount,
          taxRate: quotation.taxRate,
          taxAmount: quotation.taxAmount,
          total: quotation.total,
          amountPaid: 0,
          balanceDue: quotation.total,

          notes: quotation.notes,
          paymentTerms: quotation.paymentTerms,

          lineItems: {
            create: quotation.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: {
          lineItems: true,
          payments: true,
        },
      });

      const updatedQuotation = await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'converted' },
      });

      return { invoice, quotation: updatedQuotation };
    });

    res.status(201).json({
      success: true,
      invoice: result.invoice,
      quotation: result.quotation,
      message: `Quotation converted to Invoice #${result.invoice.invoiceNumber} successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
