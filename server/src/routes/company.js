import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database.js';
import requireAuth from '../middleware/auth.js';
import config from '../config/index.js';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `logo-${req.userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are permitted.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

// All company routes require authentication
router.use(requireAuth);

/**
 * GET /api/company
 * Retrieve the company profile for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    let companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: req.userId },
    });

    // Create default profile if it doesn't exist
    if (!companyProfile) {
      companyProfile = await prisma.companyProfile.create({
        data: {
          userId: req.userId,
          companyName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim(),
          email: req.user?.email || '',
        },
      });
    }

    res.json({
      success: true,
      company: companyProfile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/company
 * Update the company profile
 */
router.put('/', async (req, res, next) => {
  try {
    const {
      companyName,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      country,
      taxId,
      logoUrl,
      defaultCurrency,
      defaultPaymentTerms,
      defaultTaxRate,
      defaultNotes,
      quotePrefix,
      invoicePrefix,
      nextQuoteNumber,
      nextInvoiceNumber,
    } = req.body;

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = String(companyName);
    if (email !== undefined) updateData.email = String(email);
    if (phone !== undefined) updateData.phone = String(phone);
    if (website !== undefined) updateData.website = String(website);
    if (address !== undefined) updateData.address = String(address);
    if (city !== undefined) updateData.city = String(city);
    if (state !== undefined) updateData.state = String(state);
    if (zipCode !== undefined) updateData.zipCode = String(zipCode);
    if (country !== undefined) updateData.country = String(country);
    if (taxId !== undefined) updateData.taxId = String(taxId);
    if (logoUrl !== undefined) updateData.logoUrl = String(logoUrl);
    if (defaultCurrency !== undefined) updateData.defaultCurrency = String(defaultCurrency).toUpperCase();
    if (defaultPaymentTerms !== undefined) updateData.defaultPaymentTerms = String(defaultPaymentTerms);
    if (defaultTaxRate !== undefined) updateData.defaultTaxRate = parseFloat(defaultTaxRate) || 0;
    if (defaultNotes !== undefined) updateData.defaultNotes = String(defaultNotes);
    if (quotePrefix !== undefined) updateData.quotePrefix = String(quotePrefix).trim();
    if (invoicePrefix !== undefined) updateData.invoicePrefix = String(invoicePrefix).trim();
    if (nextQuoteNumber !== undefined) updateData.nextQuoteNumber = parseInt(nextQuoteNumber, 10) || 1;
    if (nextInvoiceNumber !== undefined) updateData.nextInvoiceNumber = parseInt(nextInvoiceNumber, 10) || 1;

    const companyProfile = await prisma.companyProfile.upsert({
      where: { userId: req.userId },
      update: updateData,
      create: {
        userId: req.userId,
        ...updateData,
      },
    });

    res.json({
      success: true,
      company: companyProfile,
      message: 'Company profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/company/logo
 * Upload company logo and update profile
 */
router.post('/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded.',
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    const companyProfile = await prisma.companyProfile.upsert({
      where: { userId: req.userId },
      update: { logoUrl },
      create: {
        userId: req.userId,
        logoUrl,
      },
    });

    res.json({
      success: true,
      logoUrl,
      company: companyProfile,
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
