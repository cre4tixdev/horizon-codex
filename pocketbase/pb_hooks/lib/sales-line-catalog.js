module.exports = (app, user, currency, priced, previousLines, rawLines = []) => {
  const catalog = require(`${__hooks}/lib/catalog.js`)
  const existingProducts = previousLines.filter((line) => line.product)
  for (const line of priced.lines.filter((line) => line.product)) {
    const productKind = catalog.get(app, 'inventory_products', line.product)
    if (Boolean(line.kit_key) !== (productKind.getString('composition_mode') === 'kit') || line.kit_parent && productKind.getString('composition_mode') === 'kit') throw new BadRequestError('Ajoutez un kit avec sa composition complète, sans kit imbriqué.')
    const raw = rawLines[line.position - 1] || {}
    const refresh = require(`${__hooks}/lib/sales-cost-refresh.js`)
    const previous = raw.id ? refresh.previousLine(existingProducts, raw) : existingProducts.find((old) => old.product === line.product && old.product_supplier === line.product_supplier)
    if (previous) { if (line.unit !== previous.unit) throw new BadRequestError('Le produit utilise une autre unité de base.'); line.catalog_snapshot = refresh.capture(app, user, currency, line, raw, previous); continue }
    if (!catalog.allowed(app, user)) throw new ForbiddenError('Accès au catalogue refusé.')
    const product = catalog.get(app, 'inventory_products', line.product)
    if (!product.getBool('active') || !product.getBool('sale_enabled')) throw new BadRequestError('Choisissez un produit actif pouvant être vendu.')
    if (product.getString('sale_currency') !== currency) throw new BadRequestError('La devise du produit est différente de celle du devis.')
    const selection = catalog.productPrice(app, product, line.product_supplier || 'reference'); if (selection.warning) throw new BadRequestError(selection.warning)
    const supplier = line.product_supplier ? catalog.get(app, 'inventory_product_suppliers', line.product_supplier) : null
    if (supplier && (supplier.getString('product') !== product.id || !supplier.getBool('active'))) throw new BadRequestError('Tarif fournisseur invalide.')
    if (supplier && supplier.getString('currency') !== currency) throw new BadRequestError('La devise du fournisseur est différente de celle du devis.')
    const unit = catalog.get(app, 'inventory_units', product.getString('base_unit'))
    if (unit.getString('code') !== line.unit) throw new BadRequestError('Le produit utilise une autre unité de base.')
    const category = catalog.get(app, 'inventory_product_categories', product.getString('category'))
    line.catalog_snapshot = { composition_mode: product.getString('composition_mode'), kind: product.getString('kind'), sku: product.getString('sku'), name: product.getString('name'), manufacturer: product.getString('manufacturer'), manufacturer_ref: product.getString('manufacturer_ref'), category: category.id, category_label: category.getString('label'), coefficient: product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : category.getFloat('coefficient'), coefficient_override: product.getBool('coefficient_override'), base_unit: unit.id, unit: unit.getString('code'), reference_cost: product.getFloat('reference_cost'), source: supplier ? 'supplier' : 'reference', supplier: supplier?.getString('supplier') || '', supplier_sku: supplier?.getString('supplier_sku') || '', list_price: supplier?.getFloat('list_price') || 0, supplier_discount: supplier?.getFloat('discount') || 0, purchase_quantity: supplier?.getFloat('purchase_quantity') || 1, currency: currency, captured_at: new Date().toISOString() }
    line.catalog_snapshot = refresh.capture(app, user, currency, line, raw, null)
  }
  const previousUnits = Object.create(null)
  for (const old of previousLines.filter((line) => line.kind === 'item')) previousUnits[old.unit] = (previousUnits[old.unit] || 0) + 1
  for (const line of priced.lines.filter((line) => line.kind === 'item' && line.unit)) {
    const units = app.findRecordsByFilter('inventory_units', 'code = {:code} && active = true', '', 1, 0, { code: line.unit })
    if (!units.length) { if (!previousUnits[line.unit]) throw new BadRequestError('Choisissez une unité active du référentiel.'); previousUnits[line.unit]-- }
  }
}
