import { Router } from 'express';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/dashboard
 * Return summary metrics, financial aggregates, and recent documents for user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;

    const [
      totalQuotations,
      totalInvoices,
      draftQuotationsCount,
      draftInvoicesCount,
      sentQuotationsCount,
      sentInvoicesCount,
      acceptedQuotations,
      paidInvoices,
      invoicesAggregate,
      recentQuotations,
      recentInvoices,
    ] = await Promise.all([
      prisma.quotation.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId } }),
      prisma.quotation.count({ where: { userId, status: 'draft' } }),
      prisma.invoice.count({ where: { userId, status: 'draft' } }),
      prisma.quotation.count({ where: { userId, status: 'sent' } }),
      prisma.invoice.count({ where: { userId, status: 'sent' } }),
      prisma.quotation.count({
        where: {
          userId,
          status: { in: ['accepted', 'converted'] },
        },
      }),
      prisma.invoice.count({ where: { userId, status: 'paid' } }),
      prisma.invoice.aggregate({
        where: {
          userId,
          status: { notIn: ['cancelled'] },
        },
        _sum: {
          total: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
      prisma.quotation.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, company: true },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, company: true },
          },
        },
      }),
    ]);

    const draftDocuments = draftQuotationsCount + draftInvoicesCount;
    const sentDocuments = sentQuotationsCount + sentInvoicesCount;
    const outstandingBalance = Math.round((invoicesAggregate._sum.balanceDue || 0) * 100) / 100;
    const totalRevenue = Math.round((invoicesAggregate._sum.amountPaid || 0) * 100) / 100;

    res.json({
      success: true,
      stats: {
        totalQuotations,
        totalInvoices,
        draftDocuments,
        sentDocuments,
        acceptedQuotations,
        paidInvoices,
        outstandingBalance,
        totalRevenue,
      },
      recentQuotations,
      recentInvoices,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
