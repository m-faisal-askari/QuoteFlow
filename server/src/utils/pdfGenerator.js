import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import config from "../config/index.js";

/**
 * Format currency amount with symbol or code
 */
function formatCurrency(amount, currency = "USD") {
  const num = parseFloat(amount) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

/**
 * Format date string or Date object
 */
function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Generate a PDF for Quotation or Invoice
 * @param {'quotation' | 'invoice'} type
 * @param {Object} data - Quotation or Invoice object with lineItems, customer, etc.
 * @param {import('stream').Writable} writeStream - Writable stream (e.g. Express res)
 */
export function generateDocumentPDF(type, data, writeStream) {
  const isInvoice = type.toLowerCase() === "invoice";
  const docTitle = isInvoice ? "INVOICE" : "QUOTATION";
  const docNumber = isInvoice ? data.invoiceNumber : data.quoteNumber;
  const currency = data.currency || "USD";

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  doc.pipe(writeStream);

  const pageWidth = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28 pt

  // Colors
  const primaryColor = "#1e3a8a"; // Dark slate blue
  const secondaryColor = "#475569"; // Slate
  const tableHeaderBg = "#f1f5f9";
  const tableBorderColor = "#e2e8f0";
  const textDark = "#0f172a";
  const textMuted = "#64748b";

  // 1. Header (Logo & Company Details)
  let headerStartY = 40;

  // Resolve Logo if present
  let logoPlaced = false;
  if (data.companyLogoUrl) {
    let logoPath = data.companyLogoUrl;
    if (logoPath.startsWith("/uploads/")) {
      logoPath = path.join(config.uploadDir, logoPath.replace("/uploads/", ""));
    } else if (!path.isAbsolute(logoPath)) {
      logoPath = path.join(config.uploadDir, logoPath);
    }

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, margin, headerStartY, { fit: [130, 60] });
        logoPlaced = true;
      } catch (err) {
        // Fallback silently if image cannot be parsed
      }
    }
  }

  // Company Information (Right aligned)
  const companyRightX = pageWidth - margin;
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text(
      data.companyName || "QuoteFlow Merchant",
      margin + 150,
      headerStartY,
      {
        align: "right",
        width: contentWidth - 150,
      },
    );

  let compInfoY = headerStartY + 22;
  doc.fontSize(9).font("Helvetica").fillColor(secondaryColor);

  if (data.companyAddress) {
    doc.text(data.companyAddress, margin + 150, compInfoY, {
      align: "right",
      width: contentWidth - 150,
    });
    compInfoY += 12;
  }
  if (data.companyEmail || data.companyPhone) {
    const contactLine = [data.companyEmail, data.companyPhone]
      .filter(Boolean)
      .join(" | ");
    doc.text(contactLine, margin + 150, compInfoY, {
      align: "right",
      width: contentWidth - 150,
    });
    compInfoY += 12;
  }
  if (data.companyWebsite) {
    doc.text(data.companyWebsite, margin + 150, compInfoY, {
      align: "right",
      width: contentWidth - 150,
    });
    compInfoY += 12;
  }

  // Divider
  const headerBottomY = Math.max(
    headerStartY + (logoPlaced ? 70 : 40),
    compInfoY + 15,
  );
  doc
    .strokeColor(tableBorderColor)
    .lineWidth(1)
    .moveTo(margin, headerBottomY)
    .lineTo(pageWidth - margin, headerBottomY)
    .stroke();

  // 2. Document Title and Metadata Box
  const metaStartY = headerBottomY + 15;

  // Title on Left
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text(docTitle, margin, metaStartY);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(textDark)
    .text(`#${docNumber}`, margin, metaStartY + 26);

  // Status badge
  const statusUpper = (data.status || "draft").toUpperCase();
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text(`STATUS: ${statusUpper}`, margin, metaStartY + 42);

  // Metadata Details on Right
  const metaLabelsX = pageWidth - margin - 180;
  const metaValuesX = pageWidth - margin - 90;
  let currentMetaY = metaStartY + 5;

  doc.fontSize(9).font("Helvetica-Bold").fillColor(textMuted);
  doc.text("Issue Date:", metaLabelsX, currentMetaY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(formatDate(data.issueDate), metaValuesX, currentMetaY, {
      align: "right",
      width: 90,
    });
  currentMetaY += 15;

  if (isInvoice) {
    doc
      .font("Helvetica-Bold")
      .fillColor(textMuted)
      .text("Due Date:", metaLabelsX, currentMetaY);
    doc
      .font("Helvetica")
      .fillColor(textDark)
      .text(formatDate(data.dueDate), metaValuesX, currentMetaY, {
        align: "right",
        width: 90,
      });
    currentMetaY += 15;
  } else if (data.expiryDate) {
    doc
      .font("Helvetica-Bold")
      .fillColor(textMuted)
      .text("Valid Until:", metaLabelsX, currentMetaY);
    doc
      .font("Helvetica")
      .fillColor(textDark)
      .text(formatDate(data.expiryDate), metaValuesX, currentMetaY, {
        align: "right",
        width: 90,
      });
    currentMetaY += 15;
  }

  doc
    .font("Helvetica-Bold")
    .fillColor(textMuted)
    .text("Currency:", metaLabelsX, currentMetaY);
  doc
    .font("Helvetica")
    .fillColor(textDark)
    .text(currency, metaValuesX, currentMetaY, { align: "right", width: 90 });
  currentMetaY += 15;

  // 3. Bill To Box
  const billToY = Math.max(metaStartY + 65, currentMetaY + 10);

  doc
    .rect(margin, billToY, contentWidth, 58)
    .fillAndStroke("#f8fafc", tableBorderColor);

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text("BILL TO:", margin + 12, billToY + 8);

  const clientName =
    data.customerName || data.customer?.name || "Valued Customer";
  const clientCompany = data.customerCompany || data.customer?.company || "";
  const clientEmail = data.customerEmail || data.customer?.email || "";
  const clientAddress = data.customerAddress || "";

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(textDark)
    .text(
      clientCompany ? `${clientName} (${clientCompany})` : clientName,
      margin + 12,
      billToY + 20,
    );

  const contactPieces = [clientEmail, clientAddress]
    .filter(Boolean)
    .join(" • ");
  if (contactPieces) {
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text(contactPieces, margin + 12, billToY + 36, {
        width: contentWidth - 24,
        ellipsis: true,
      });
  }

  // 4. Line Items Table
  let tableTop = billToY + 75;

  // Table Column Definitions
  // Total width: 515 pt
  const colDescX = margin;
  const colDescW = 250;
  const colQtyX = margin + colDescW;
  const colQtyW = 60;
  const colPriceX = colQtyX + colQtyW;
  const colPriceW = 100;
  const colAmtX = colPriceX + colPriceW;
  const colAmtW = 105;

  // Table Header Background
  doc.rect(margin, tableTop, contentWidth, 22).fill(tableHeaderBg);

  // Table Header Text
  doc.fontSize(8).font("Helvetica-Bold").fillColor(secondaryColor);
  doc.text("DESCRIPTION", colDescX + 8, tableTop + 6, { width: colDescW - 16 });
  doc.text("QTY", colQtyX, tableTop + 6, {
    width: colQtyW - 8,
    align: "right",
  });
  doc.text("UNIT PRICE", colPriceX, tableTop + 6, {
    width: colPriceW - 8,
    align: "right",
  });
  doc.text("AMOUNT", colAmtX, tableTop + 6, {
    width: colAmtW - 8,
    align: "right",
  });

  let rowY = tableTop + 22;

  // Line item rows
  const lineItems = data.lineItems || [];
  lineItems.forEach((item, index) => {
    // Check if new page is needed
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;

      // Repeat table header on new page
      doc.rect(margin, rowY, contentWidth, 22).fill(tableHeaderBg);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(secondaryColor);
      doc.text("DESCRIPTION", colDescX + 8, rowY + 6, { width: colDescW - 16 });
      doc.text("QTY", colQtyX, rowY + 6, {
        width: colQtyW - 8,
        align: "right",
      });
      doc.text("UNIT PRICE", colPriceX, rowY + 6, {
        width: colPriceW - 8,
        align: "right",
      });
      doc.text("AMOUNT", colAmtX, rowY + 6, {
        width: colAmtW - 8,
        align: "right",
      });
      rowY += 22;
    }

    const rowBg = index % 2 === 0 ? "#ffffff" : "#fcfcfd";
    doc.rect(margin, rowY, contentWidth, 24).fill(rowBg);

    doc.fontSize(9).font("Helvetica").fillColor(textDark);
    doc.text(item.description || "Item", colDescX + 8, rowY + 7, {
      width: colDescW - 16,
      ellipsis: true,
    });
    doc.text(String(item.quantity ?? 1), colQtyX, rowY + 7, {
      width: colQtyW - 8,
      align: "right",
    });
    doc.text(formatCurrency(item.unitPrice, currency), colPriceX, rowY + 7, {
      width: colPriceW - 8,
      align: "right",
    });
    doc
      .font("Helvetica-Bold")
      .text(formatCurrency(item.amount, currency), colAmtX, rowY + 7, {
        width: colAmtW - 8,
        align: "right",
      });

    // Row bottom border
    doc
      .strokeColor(tableBorderColor)
      .lineWidth(0.5)
      .moveTo(margin, rowY + 24)
      .lineTo(pageWidth - margin, rowY + 24)
      .stroke();

    rowY += 24;
  });

  // 5. Financial Summary (Right Aligned)
  let summaryY = rowY + 15;
  if (summaryY > 680) {
    doc.addPage();
    summaryY = 50;
  }

  const summaryLabelX = pageWidth - margin - 220;
  const summaryValueX = pageWidth - margin - 100;
  const summaryWidth = 100;

  doc.fontSize(9).font("Helvetica").fillColor(secondaryColor);

  // Subtotal
  doc.text("Subtotal:", summaryLabelX, summaryY);
  doc.text(formatCurrency(data.subtotal, currency), summaryValueX, summaryY, {
    align: "right",
    width: summaryWidth,
  });
  summaryY += 16;

  // Discount
  if (data.discountAmount > 0) {
    const discountLabel =
      data.discountType === "percentage"
        ? `Discount (${data.discountValue}%):`
        : "Discount:";
    doc.text(discountLabel, summaryLabelX, summaryY);
    doc.text(
      `-${formatCurrency(data.discountAmount, currency)}`,
      summaryValueX,
      summaryY,
      { align: "right", width: summaryWidth },
    );
    summaryY += 16;
  }

  // Tax
  if (data.taxAmount > 0 || data.taxRate > 0) {
    doc.text(`Tax (${data.taxRate || 0}%):`, summaryLabelX, summaryY);
    doc.text(
      formatCurrency(data.taxAmount, currency),
      summaryValueX,
      summaryY,
      { align: "right", width: summaryWidth },
    );
    summaryY += 16;
  }

  // Divider above Total
  doc
    .strokeColor(primaryColor)
    .lineWidth(1)
    .moveTo(summaryLabelX, summaryY + 2)
    .lineTo(pageWidth - margin, summaryY + 2)
    .stroke();

  summaryY += 8;

  // Total
  doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor);
  doc.text("Total:", summaryLabelX, summaryY);
  doc.text(formatCurrency(data.total, currency), summaryValueX, summaryY, {
    align: "right",
    width: summaryWidth,
  });
  summaryY += 20;

  // If Invoice: Paid & Balance Due
  if (isInvoice) {
    doc.fontSize(9).font("Helvetica").fillColor(secondaryColor);
    doc.text("Amount Paid:", summaryLabelX, summaryY);
    doc.text(
      formatCurrency(data.amountPaid || 0, currency),
      summaryValueX,
      summaryY,
      { align: "right", width: summaryWidth },
    );
    summaryY += 16;

    doc.fontSize(10).font("Helvetica-Bold").fillColor(textDark);
    doc.text("Balance Due:", summaryLabelX, summaryY);
    doc.text(
      formatCurrency(data.balanceDue, currency),
      summaryValueX,
      summaryY,
      { align: "right", width: summaryWidth },
    );
    summaryY += 22;
  }

  // 6. Notes & Payment Terms
  let notesY = Math.max(rowY + 15, summaryY - (isInvoice ? 80 : 60));
  if (notesY > 700) {
    doc.addPage();
    notesY = 50;
  }

  const notesWidth = 260;
  if (data.notes || data.paymentTerms) {
    if (data.paymentTerms) {
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("PAYMENT TERMS", margin, notesY);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(data.paymentTerms, margin, notesY + 12, { width: notesWidth });
      notesY += 32;
    }

    if (data.notes) {
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("NOTES & INSTRUCTIONS", margin, notesY);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(data.notes, margin, notesY + 12, { width: notesWidth });
    }
  }

  // 7. Footer on all pages
  const totalPages = doc.bufferedPageRange().count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    // Footer divider: keep it inside the page's content area
    doc
      .strokeColor(tableBorderColor)
      .lineWidth(0.5)
      .moveTo(margin, 765)
      .lineTo(pageWidth - margin, 765)
      .stroke();

    // Footer text: position safely above the bottom margin
    doc.fontSize(8).font("Helvetica").fillColor(textMuted);

    doc.text(
      "Thank you for your business! Generated with QuoteFlow.",
      margin,
      778,
      {
        align: "left",
        width: contentWidth / 2,
        lineBreak: false,
      },
    );

    doc.text(
      `Page ${i + 1} of ${totalPages}`,
      pageWidth - margin - contentWidth / 2,
      778,
      {
        align: "right",
        width: contentWidth / 2,
        lineBreak: false,
      },
    );
  }


  doc.end();
}

export default generateDocumentPDF;
