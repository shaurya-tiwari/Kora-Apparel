const Product = require('../models/Product');

/**
 * Adjusts stock levels for multiple items.
 * @param {Array} items - Array of order items [{product: id, qty: number, size: string, color: string}]
 * @param {string} mode - 'deduct' or 'restore'
 */
const adjustStock = async (items, mode = 'deduct') => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const multiplier = mode === 'deduct' ? -1 : 1;
    const qtyChange = item.qty * multiplier;

    let variantUpdated = false;
    if (product.variants && product.variants.length > 0) {
      const vIdx = product.variants.findIndex(v => v.size === item.size && v.color === item.color);
      if (vIdx !== -1) {
        product.variants[vIdx].stock = Math.max(0, product.variants[vIdx].stock + qtyChange);
        variantUpdated = true;
      }
    }

    // Always adjust global master tally
    product.stock = Math.max(0, product.stock + qtyChange);
    await product.save();
  }
};

module.exports = { adjustStock };
