import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { calculateLineItemAmount } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import styles from '../styles/lineItems.module.css';

export default function LineItemsTable({
  items = [],
  onChange,
  currency = 'USD',
}) {
  const handleItemChange = (index, field, value) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;

      const newItem = {
        ...item,
        [field]: value,
      };

      const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
      const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
      newItem.amount = calculateLineItemAmount(qty, price);

      return newItem;
    });

    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    onChange([...(items || []), newItem]);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thDesc}`}>Description</th>
              <th className={`${styles.th} ${styles.thQty}`}>Quantity</th>
              <th className={`${styles.th} ${styles.thPrice}`}>Unit Price</th>
              <th className={`${styles.th} ${styles.thAmount}`}>Amount</th>
              <th className={`${styles.th} ${styles.thAction}`}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  No items added yet. Click &quot;Add Item&quot; to begin.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const amount =
                  item.amount !== undefined
                    ? item.amount
                    : calculateLineItemAmount(item.quantity, item.unitPrice);

                return (
                  <tr key={index} className={styles.tr}>
                    <td className={styles.td}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Item or service description..."
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className={styles.td}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`${styles.input} ${styles.inputRight}`}
                        value={item.quantity ?? 1}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className={styles.td}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${styles.input} ${styles.inputRight}`}
                        value={item.unitPrice ?? 0}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td className={`${styles.td} ${styles.amount}`}>
                      {formatCurrency(amount, currency)}
                    </td>
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleRemoveItem(index)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddItem}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>
    </div>
  );
}
