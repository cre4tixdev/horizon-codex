const catalog = () => require(`${__hooks}/lib/catalog.js`)
const rows = (app, id) => app.findRecordsByFilter('inventory_product_components', 'parent_product = {:id}', 'position', 0, 0, { id })
const components = (app, id) => rows(app, id).map((row) => ({ product: row.getString('component_product'), quantity: row.getFloat('quantity') }))
const settings = (app) => app.findFirstRecordByData('settings_inventory_kits', 'key', 'default')
module.exports = {
  components,
  validate(app, input, previous) {
    if (!['none', 'kit'].includes(input.composition_mode) || !['margin', 'fixed'].includes(input.kit_price_mode) || typeof input.kit_print_details !== 'boolean' || typeof input.kit_sale_price !== 'number' || !Number.isFinite(input.kit_sale_price) || input.kit_sale_price < 0 || input.kit_sale_price > 1000000000 || !Array.isArray(input.components) || input.components.length > 50) throw new BadRequestError('Composition ou prix de kit invalide.')
    if (previous && previous.getString('composition_mode') !== input.composition_mode && (app.findRecordsByFilter('sales_quote_lines', 'product = {:id}', '', 1, 0, { id: previous.id }).length || app.findRecordsByFilter('inventory_product_components', 'component_product = {:id}', '', 1, 0, { id: previous.id }).length)) throw new BadRequestError('La composition est figée après utilisation. Créez une nouvelle référence de kit.')
    if (input.composition_mode === 'none') { if (input.components.length) throw new BadRequestError('Activez Produit composé pour conserver des composants.'); return }
    if (input.purchase_enabled || input.stock_policy !== 'none' || input.tracking !== 'none' || input.offers.length || input.cost_override) throw new BadRequestError('Le kit utilise les achats, le stock et les coûts de ses composants.')
    if (!input.components.length) throw new BadRequestError('Ajoutez au moins un composant au kit.')
    if (!previous || previous.getString('composition_mode') !== 'kit' || input.sku !== previous.getString('sku')) {
      const prefix = settings(app).getString('prefix')
      if (!input.sku.startsWith(prefix) || input.sku.length <= prefix.length) throw new BadRequestError(`La référence du kit doit commencer par ${prefix}, suivie d’un suffixe.`)
    }
    const seen = new Set()
    for (const item of input.components) {
      if (!item || Object.keys(item).some((key) => !['product', 'quantity'].includes(key)) || typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity < 0.000001 || item.quantity > 1000000 || seen.has(item.product) || previous?.id === item.product) throw new BadRequestError('Composant répété, auto-référence ou quantité invalide.')
      seen.add(item.product)
      const product = catalog().get(app, 'inventory_products', item.product)
      if (!product.getBool('active') || product.getString('composition_mode') === 'kit') throw new BadRequestError('Choisissez des composants simples actifs. Les kits imbriqués sont interdits.')
      if (product.getString('sale_currency') !== input.sale_currency) throw new BadRequestError('Les composants doivent utiliser la devise du kit.')
      if (!catalog().get(app, 'inventory_units', product.getString('base_unit')).getBool('active')) throw new BadRequestError('L’unité du composant est archivée.')
    }
  },
  save(app, product, input) {
    for (const row of rows(app, product.id)) app.delete(row)
    input.components.forEach((item, index) => { const row = new Record(app.findCollectionByNameOrId('inventory_product_components')); row.set('parent_product', product.id); row.set('component_product', item.product); row.set('quantity', item.quantity); row.set('position', index + 1); app.save(row) })
  },
  price(app, product) {
    let cost = 0, warning = ''
    for (const item of components(app, product.id)) {
      const child = catalog().get(app, 'inventory_products', item.product)
      if (child.getString('composition_mode') === 'kit') { warning = 'Kit imbriqué indisponible.'; continue }
      const price = catalog().productPrice(app, child)
      if (!child.getBool('active') || !child.getBool('sale_enabled') || price.warning || price.currency !== product.getString('sale_currency')) warning = price.warning || 'Un composant est indisponible ou dans une autre devise.'
      cost += item.quantity * price.unit_cost
    }
    if (!components(app, product.id).length) warning = 'Le kit ne contient aucun composant.'
    const family = catalog().get(app, 'inventory_product_categories', product.getString('category'))
    if (!family.getBool('active')) warning = 'La famille du kit est archivée.'
    const coefficient = product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : family.getFloat('coefficient')
    cost = Math.round(cost * 1e6) / 1e6
    const price = product.getString('kit_price_mode') === 'fixed' ? product.getFloat('kit_sale_price') : cost * coefficient
    return { unit_cost: cost, unit_price: warning ? null : Math.round(price * 1e6) / 1e6, coefficient, margin_rate: cost > 0 ? (price / cost - 1) * 100 : null, currency: product.getString('sale_currency'), product_supplier: '', supplier: '', warning, source: 'kit' }
  },
  quote(app, product, currency) {
    const price = module.exports.price(app, product)
    if (price.warning || currency !== price.currency) throw new BadRequestError(price.warning || 'La devise du kit est différente de celle du devis.')
    const key = $security.randomString(24), componentRows = components(app, product.id)
    const unit = catalog().get(app, 'inventory_units', product.getString('base_unit'))
    if (!unit.getBool('active')) throw new BadRequestError('L’unité du kit est archivée.')
    const parent = { product: product.id, product_supplier: '', description: product.getString('description') || product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), unit: unit.getString('code'), unit_cost: price.unit_cost, unit_price: price.unit_price, margin_percent: price.margin_rate || 0, kit_key: key, kit_print_details: product.getBool('kit_print_details'), price_source: product.getString('kit_price_mode') === 'fixed' || price.unit_cost <= 0 ? 'manual' : 'margin' }
    const children = componentRows.map((item) => {
      const child = catalog().get(app, 'inventory_products', item.product), value = catalog().productPrice(app, child)
      return { kind: 'item', product: child.id, product_supplier: value.product_supplier, description: child.getString('name'), brand: child.getString('manufacturer'), reference: child.getString('sku'), unit: catalog().get(app, 'inventory_units', child.getString('base_unit')).getString('code'), quantity: item.quantity, kit_quantity: item.quantity, kit_parent: key, unit_cost: value.unit_cost, unit_price: 0, margin_percent: 0, price_source: 'manual', discount: 0, is_option: false, show_total: false }
    })
    return { ...parent, kit_lines: children }
  },
  readSettings(e) {
    const policy = require(`${__hooks}/lib/access-policy.js`)
    if (!catalog().allowed(e.app, e.auth) && !policy.settings(e.app, e.auth)) throw new ForbiddenError('Accès aux paramètres Kits refusé.')
    const record = settings(e.app); return e.json(200, { prefix: record.getString('prefix'), updated: record.getString('updated') })
  },
  saveSettings(e) {
    const policy = require(`${__hooks}/lib/access-policy.js`), b = e.requestInfo().body
    if (!policy.settings(e.app, e.auth)) throw new ForbiddenError('Configuration des kits réservée aux administrateurs.')
    if (!b || Object.keys(b).some((key) => !['prefix', 'updated'].includes(key)) || typeof b.prefix !== 'string' || !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(b.prefix)) throw new BadRequestError('Préfixe : 1 à 20 lettres majuscules, chiffres, tirets ou underscores.')
    let saved
    e.app.runInTransaction((app) => { if (!policy.settings(app, e.auth)) throw new ForbiddenError('Accès refusé.'); const record = settings(app); if (record.getString('updated') !== b.updated) throw new ApiError(409, 'Le préfixe a changé. Rechargez les paramètres.'); const before = record.publicExport(); record.set('prefix', b.prefix); app.save(record); policy.audit(app, 'settings_inventory_kits', record.id, e.auth.id, before, record.publicExport(), 'update'); saved = { prefix: record.getString('prefix'), updated: record.getString('updated') } })
    return e.json(200, saved)
  },
}
