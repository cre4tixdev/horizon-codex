// Inventory owns this restricted product/pricing projection consumed by Purchasing.
module.exports = (app, user, id, supplier = '', currency = '') => {
  if (!require(`${__hooks}/lib/catalog.js`).allowed(app, user)) throw new ForbiddenError('Accès au catalogue nécessaire.')
  const product = app.findRecordById('inventory_products', id)
  if (!product.getBool('active') || !product.getBool('purchase_enabled')) throw new BadRequestError('Ce produit ne peut pas être acheté.')
  const offers = app.findRecordsByFilter('inventory_product_suppliers', 'product = {:id} && active = true', '-is_preferred,created,id', 0, 0, { id })
  const today = new Date().toISOString().slice(0, 10)
  const offer = offers.find((item) => (!supplier || item.getString('supplier') === supplier) && (!currency || item.getString('currency') === currency) && (!item.getString('valid_from') || item.getString('valid_from').slice(0, 10) <= today) && (!item.getString('valid_until') || item.getString('valid_until').slice(0, 10) >= today))
  return { product: id, description: product.getString('description') || product.getString('name'), reference: product.getString('sku'), brand: product.getString('manufacturer'), unit: app.findRecordById('inventory_units', product.getString('base_unit')).getString('code'), supplier: offer?.getString('supplier') || '', currency: offer?.getString('currency') || product.getString('sale_currency'), unit_price: offer ? offer.getFloat('purchase_price') / offer.getFloat('purchase_quantity') : product.getFloat('reference_cost'), stock_policy: product.getString('stock_policy'), tracking: product.getString('tracking'), snapshot: { product: product.publicExport(), offer: offer?.publicExport() || null } }
}
