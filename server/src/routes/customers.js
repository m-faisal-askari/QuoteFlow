import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import { checkValidation } from '../middleware/validate.js';

const router = Router();

// Protect all customer routes
router.use(requireAuth);

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email address'),
  checkValidation,
];

/**
 * GET /api/customers
 * List all customers belonging to the user
 */
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;

    const where = {
      userId: req.userId,
    };

    if (search && typeof search === 'string') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { company: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            quotations: true,
            invoices: true,
          },
        },
      },
    });

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customers/:id
 * Retrieve a single customer with ownership verification
 */
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        quotations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            issueDate: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            balanceDue: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            quotations: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found.',
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/', customerValidation, async (req, res, next) => {
  try {
    const {
      name,
      company = '',
      email = '',
      phone = '',
      address = '',
      city = '',
      state = '',
      zipCode = '',
      country = '',
      notes = '',
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: country.trim(),
        notes: notes.trim(),
      },
    });

    res.status(201).json({
      success: true,
      customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/customers/:id
 * Update an existing customer
 */
router.put('/:id', customerValidation, async (req, res, next) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found.',
      });
    }

    const {
      name,
      company,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      notes,
    } = req.body;

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(company !== undefined && { company: company.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(address !== undefined && { address: address.trim() }),
        ...(city !== undefined && { city: city.trim() }),
        ...(state !== undefined && { state: state.trim() }),
        ...(zipCode !== undefined && { zipCode: zipCode.trim() }),
        ...(country !== undefined && { country: country.trim() }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
    });

    res.json({
      success: true,
      customer: updated,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/customers/:id
 * Delete a customer if they have no linked quotations or invoices
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        _count: {
          select: {
            quotations: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found.',
      });
    }

    const totalQuotations = customer._count.quotations;
    const totalInvoices = customer._count.invoices;

    if (totalQuotations > 0 || totalInvoices > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete customer. They are linked to ${totalQuotations} quotation(s) and ${totalInvoices} invoice(s).`,
      });
    }

    await prisma.customer.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
