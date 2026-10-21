import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import { checkValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

const paymentValidation = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Payment amount must be greater than zero'),
  checkValidation,
];

/**
 * Helper to record payment and recalculate invoice balance and status
 */
async function processPayment(req, res, next, invoiceId) {
  try {
    const { amount, date, method = '', reference = '', notes = '' } = req.body;
    const paymentAmount = Math.round(parseFloat(amount) * 100) / 100;

    // Verify invoice ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          date: date ? new Date(date) : new Date(),
          method: method.trim(),
          reference: reference.trim(),
          notes: notes.trim(),
        },
      });

      // Recalculate payments
      const payments = await tx.payment.findMany({
        where: { invoiceId: invoice.id },
      });

      const totalPaid = Math.round(payments.reduce((acc, p) => acc + p.amount, 0) * 100) / 100;
      const balanceDue = Math.max(0, Math.round((invoice.total - totalPaid) * 100) / 100);

      let newStatus = invoice.status;
      if (balanceDue <= 0 && invoice.total > 0) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: totalPaid,
          balanceDue,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { date: 'desc' },
          },
          lineItems: true,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    res.status(201).json({
      success: true,
      payment: result.payment,
      invoice: result.invoice,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/invoices/:invoiceId/payments or POST /api/payments
 */
router.post('/', paymentValidation, async (req, res, next) => {
  const invoiceId = req.params.invoiceId || req.body.invoiceId;
  if (!invoiceId) {
    return res.status(400).json({
      success: false,
      error: 'invoiceId is required to record a payment.',
    });
  }
  return processPayment(req, res, next, invoiceId);
});

/**
 * POST /api/payments/:invoiceId or POST /api/payments/invoice/:invoiceId
 */
router.post('/:invoiceId', paymentValidation, async (req, res, next) => {
  return processPayment(req, res, next, req.params.invoiceId);
});

/**
 * DELETE /api/payments/:id
 * Delete a payment and recalculate invoice balance and status
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found.',
      });
    }

    // Verify invoice ownership
    if (payment.invoice.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this payment.',
      });
    }

    const invoiceId = payment.invoiceId;
    const invoiceTotal = payment.invoice.total;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: req.params.id },
      });

      const remainingPayments = await tx.payment.findMany({
        where: { invoiceId },
      });

      const totalPaid = Math.round(remainingPayments.reduce((acc, p) => acc + p.amount, 0) * 100) / 100;
      const balanceDue = Math.max(0, Math.round((invoiceTotal - totalPaid) * 100) / 100);

      let newStatus = payment.invoice.status;
      if (balanceDue <= 0 && invoiceTotal > 0) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      } else if (payment.invoice.status === 'paid' || payment.invoice.status === 'partially_paid') {
        newStatus = 'sent';
      }

      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          balanceDue,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { date: 'desc' },
          },
        },
      });
    });

    res.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Payment removed and invoice recalculated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
