export function calculateLineItemAmount(quantity, unitPrice) {
  return Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0) * 100) / 100;
}

export function calculateTotals(lineItems = [], discountType = 'percentage', discountValue = 0, taxRate = 0) {
  const subtotal = (lineItems || []).reduce((sum, item) => {
    return sum + calculateLineItemAmount(item.quantity, item.unitPrice);
  }, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Math.round(subtotal * (Number(discountValue) || 0) / 100 * 100) / 100;
  } else {
    discountAmount = Math.round((Number(discountValue) || 0) * 100) / 100;
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * (Number(taxRate) || 0) / 100 * 100) / 100;
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxAmount,
    total,
  };
}
