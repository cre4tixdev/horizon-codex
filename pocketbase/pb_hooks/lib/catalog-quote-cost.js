// Inventory-owned projection: read the effective cost displayed on the product record.
module.exports = (app, user, currency, line) => {
  const catalog = require(`${__hooks}/lib/catalog.js`)
  if (!catalog.allowed(app, user)) throw new ForbiddenError('Accès au catalogue refusé.')
  const unavailable = (reason) => ({ available: false, reason })
  const product = app.findRecordsByFilter('inventory_products', 'id = {:id}', '', 1, 0, { id: line.product })[0]
  if (!product || !product.getBool('active') || !product.getBool('sale_enabled')) return unavailable('Produit indisponible à la vente.')
  const price = catalog.productPrice(app, product)
  const offer = price.product_supplier ? catalog.get(app, 'inventory_product_suppliers', price.product_supplier) : null
  if (price.warning) return unavailable(price.warning)
  if (price.currency !== currency) return unavailable('Devise incompatible avec le devis.')
  const unit = catalog.get(app, 'inventory_units', product.getString('base_unit'))
  if (!unit.getBool('active') || unit.getString('code') !== line.unit) return unavailable('Unité de base différente ou archivée.')
  const family = catalog.get(app, 'inventory_product_categories', product.getString('category'))
  const cost = Math.round(price.unit_cost * 1e6) / 1e6
  const token = $security.sha256(JSON.stringify([product.id, product.getString('updated'), offer?.id || '', offer?.getString('updated') || '', family.getString('updated'), unit.getString('updated'), currency, cost]))
  return { available: true, unit_cost: cost, token, product_supplier: price.product_supplier, source: offer ? `Tarif fournisseur · ${catalog.get(app, 'contacts_companies', offer.getString('supplier')).getString('name')}` : product.getBool('cost_override') ? 'Coût manuel de la fiche produit' : 'Coût de référence produit' }
}
