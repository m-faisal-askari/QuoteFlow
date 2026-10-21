import { Router } from 'express';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import { generateDocumentPDF } from '../utils/pdfGenerator.js';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/pdf/quotation/:id
 * Generate and stream quotation PDF
 */
router.get('/quotation/:id', async (req, res, next) => {
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
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found.',
      });
    }

    const filename = `Quotation-${quotation.quoteNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateDocumentPDF('quotation', quotation, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdf/invoice/:id
 * Generate and stream invoice PDF
 */
router.get('/invoice/:id', async (req, res, next) => {
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
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
    }

    const filename = `Invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateDocumentPDF('invoice', invoice, res);
  } catch (error) {
    next(error);
  }
});

export default router;
