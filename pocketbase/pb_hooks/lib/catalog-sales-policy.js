// Catalogue-owned projection for sales execution; legacy snapshots use the current kind.
module.exports = (app, line) => {
  const id = line.getString('product')
  if (!id) return { purchase_applicable: true, stock_applicable: true }
  const product = app.findRecordById('inventory_products', id)
  const snapshot = JSON.parse(line.getString('catalog_snapshot') || 'null') || JSON.parse(line.getString('snapshot') || 'null')?.catalog_snapshot || {}
  const kind = snapshot.kind || product.getString('kind')
  const brand = snapshot.manufacturer ?? product.getString('manufacturer')
  const internal = kind === 'service' && brand.trim().toLowerCase() === 'cvs'
  return { purchase_applicable: !internal && product.getBool('purchase_enabled'), stock_applicable: kind !== 'service' && product.getString('stock_policy') !== 'none' }
}
