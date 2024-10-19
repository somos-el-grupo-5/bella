const products = require('./products.json');

function generateProductSummary() {
  return products
    .map(
      (product) =>
        `- ${product.brand} ${product.name} (${product.category}) in color ${product.color}. Link: ${product.link}`
    )
    .join('\n');
}

module.exports = {
  generateProductSummary,
};
