const { canonical, incoming, authorize } = require(`${__hooks}/lib/merge-common.js`)
const policy = require(`${__hooks}/lib/access-policy.js`)
const editable = ['primary_image', 'name', 'description', 'category', 'manufacturer_ref', 'weight_kg', 'volume_m3', 'hs_code', 'origin_country']
const structural = ['sku', 'barcode', 'brand', 'kind', 'base_unit', 'sale_unit', 'stock_policy', 'replenishment_policy', 'tracking', 'composition_mode', 'sale_currency', 'variant_group', 'reference_cost']
const rows = (app, name, id) => app.findRecordsByFilter(name, 'product = {:id}', 'id', 0, 0, { id })
const guard = (e) => {
  authorize(e.app, e.auth, 'inventory')
  const b = e.requestInfo().body
  if (b.kind !== 'products' || !/^[a-z0-9]{15}$/.test(b.source || '') || !/^[a-z0-9]{15}$/.test(b.target || '') || b.source === b.target || Object.keys(b).some((key) => !['kind', 'source', 'target', 'fingerprint', 'choices', 'confirmed'].includes(key))) throw new BadRequestError('Choisissez deux produits distincts.')
  return b
}
const inspect = (app, sourceId, targetId) => {
  const source = app.findRecordById('inventory_products', sourceId), target = app.findRecordById('inventory_products', targetId), blockers = []
  if (!source.getBool('active') || source.getString('merged_into') || !target.getBool('active') || target.getString('merged_into')) throw new BadRequestError('Choisissez deux produits actifs et non fusionnés.')
  const offers = rows(app, 'inventory_product_suppliers', sourceId), targetOffers = rows(app, 'inventory_product_suppliers', targetId)
  const histories = offers.flatMap((offer) => app.findRecordsByFilter('inventory_supplier_price_history', 'product_supplier = {:id}', 'id', 0, 0, { id: offer.id }))
  const dependencies = incoming(app, [source, ...offers], (record, collection, field) => record.id === sourceId && collection === 'inventory_product_suppliers' && field === 'product' || record.collection().name === 'inventory_product_suppliers' && collection === 'inventory_supplier_price_history' && field === 'product_supplier')
  if (dependencies.length) blockers.push('Le produit à absorber ou une de ses offres possède du stock, une composition ou des pièces métier liées. Conservez-le comme destination ; aucun mouvement, réservation, lot/série ou document ne sera réécrit.')
  const mismatch = ['brand', 'kind', 'base_unit', 'sale_unit', 'stock_policy', 'replenishment_policy', 'tracking', 'composition_mode', 'sale_currency'].filter((key) => source.getString(key) !== target.getString(key))
  if (mismatch.length) blockers.push('Produits incompatibles : la marque, les unités, le type, les politiques, le suivi, la composition et la devise doivent correspondre.')
  for (const key of ['manufacturer_ref', 'variant_group']) if (source.getString(key) && target.getString(key) && source.getString(key).trim().toLowerCase() !== target.getString(key).trim().toLowerCase()) blockers.push('Références fabricant ou variantes différentes : vérifiez l’identité des produits avant fusion.')
  const refs = require(`${__hooks}/lib/import-reference-merge.js`), external = [...refs.references(app, 'inventory_products', sourceId), ...refs.references(app, 'inventory_products', targetId)]
  const display = (record, key) => {
    const relation = { category: ['inventory_product_categories', 'label'], brand: ['inventory_brands', 'name'], base_unit: ['inventory_units', 'code'], sale_unit: ['inventory_units', 'code'] }[key]
    return relation && record.getString(key) ? app.findRecordById(relation[0], record.getString(key)).getString(relation[1]) : ['kind', 'stock_policy', 'replenishment_policy', 'tracking', 'composition_mode'].includes(key) ? ({ equipment: 'Équipement', consumable: 'Fourniture', service: 'Service', none: 'Aucun', stocked: 'Stocké', on_demand: 'À la demande', manual: 'Manuel', min_max: 'Mini / maxi', lot: 'Lot', serial: 'Série' }[record.getString(key)] || '') : ''
  }
  const identity = (record) => ({ id: record.id, collectionId: record.collection().id, label: `${record.getString('sku')} · ${record.getString('name')}` })
  const dto = { kind: 'products', source: identity(source), target: identity(target), fields: [...editable, ...structural].map((key) => ({ key, source: source.getString(key), target: target.getString(key), source_label: display(source, key), target_label: display(target, key), readonly: structural.includes(key) })), blockers: [...new Set(blockers)], counts: { offers: offers.length, histories: histories.length, references: refs.references(app, 'inventory_products', sourceId).length }, fingerprint: $security.sha256(JSON.stringify(canonical([source.publicExport(), target.publicExport(), offers.map((r) => r.publicExport()), targetOffers.map((r) => r.publicExport()), histories.map((r) => r.publicExport()), external.map((r) => r.publicExport()), dependencies]))) }
  return { source, target, offers, targetOffers, dto }
}
const preview = (e) => { const b = guard(e); return e.json(200, inspect(e.app, b.source, b.target).dto) }
const apply = (e) => {
  const b = guard(e)
  if (b.confirmed !== true || typeof b.fingerprint !== 'string' || !b.choices || typeof b.choices !== 'object' || Array.isArray(b.choices) || Object.entries(b.choices).some(([key, value]) => !editable.includes(key) || !['source', 'target'].includes(value))) throw new BadRequestError('Confirmez les valeurs choisies dans l’aperçu.')
  let result
  e.app.runInTransaction((app) => {
    authorize(app, e.auth, 'inventory')
    const existing = app.findRecordById('inventory_products', b.source)
    if (existing.getString('merged_into') === b.target) { result = { id: b.target }; return }
    const { source, target, offers, targetOffers, dto } = inspect(app, b.source, b.target)
    if (dto.fingerprint !== b.fingerprint) throw new ApiError(409, 'Les produits ou leurs liens ont changé. Rechargez l’aperçu.')
    if (dto.blockers.length) throw new ApiError(409, dto.blockers[0])
    const before = target.publicExport()
    for (const key of editable) {
      const fromSource = b.choices[key] === 'source' || !b.choices[key] && !target.getString(key)
      if (!fromSource) continue
      if (key === 'primary_image') {
        if (!source.getString(key)) { target.set(key, ''); continue }
        const fs = app.newFilesystem()
        try { const reader = fs.getReader(source.baseFilesPath() + '/' + source.getString(key)); try { target.set(key, $filesystem.fileFromBytes(toBytes(reader), source.getString(key))) } finally { reader.close() } } finally { fs.close() }
      } else target.set(key, source.get(key))
    }
    const catalog = require(`${__hooks}/lib/catalog.js`)
    catalog.validateProduct(app, { ...Object.fromEntries(catalog.fields.map((key) => [key, target.get(key)])), offers: [] }, target.original())
    app.save(target); policy.audit(app, 'inventory_products', target.id, e.auth.id, before, target.publicExport(), 'update')
    let preferred = targetOffers.some((offer) => offer.getBool('active') && offer.getBool('is_preferred'))
    for (const offer of offers) {
      const previous = offer.publicExport(); offer.set('product', target.id)
      if (offer.getBool('active') && offer.getBool('is_preferred')) { if (preferred) offer.set('is_preferred', false); else preferred = true }
      app.save(offer); policy.audit(app, 'inventory_product_suppliers', offer.id, e.auth.id, previous, offer.publicExport(), 'update')
    }
    require(`${__hooks}/lib/import-reference-merge.js`).apply(app, 'inventory_products', source.id, target.id)
    const previous = source.publicExport(); source.set('active', false); source.set('merged_into', target.id); source.set('merged_at', new Date().toISOString()); source.set('__merge_operation', true); app.save(source)
    policy.audit(app, 'inventory_products', source.id, e.auth.id, previous, source.publicExport(), 'archive')
    policy.audit(app, 'inventory_products', target.id, e.auth.id, { source: source.id }, { target: target.id, counts: dto.counts, choices: b.choices }, 'merge')
    const activity = require(`${__hooks}/lib/activity.js`)
    activity.publish(app, target, e.auth.id, 'change', `Fusion du produit ${source.getString('sku')}`, { action: 'merge', source_id: source.id }, '')
    activity.publish(app, source, e.auth.id, 'change', `Produit fusionné vers ${target.getString('sku')}`, { action: 'merge', target_id: target.id }, '')
    result = { id: target.id }
  })
  return e.json(200, result)
}
const identities = (app) => require(`${__hooks}/lib/merge-metadata.js`)(app, 'inventory_products', ['id', 'name', 'sku', 'barcode', 'brand', 'manufacturer_ref', 'manufacturer', 'kind', 'base_unit']).map((r) => ({ ...r, label: `${r.sku} · ${r.name}`, detail: [r.manufacturer, r.manufacturer_ref].filter(Boolean).join(' · ') }))
const sources = (e) => {
  if (!require(`${__hooks}/lib/catalog.js`).allowed(e.app, e.auth)) throw new ForbiddenError('Accès au catalogue refusé.')
  const target = require(`${__hooks}/lib/catalog.js`).get(e.app, 'inventory_products', e.request.pathValue('id'))
  return e.json(200, { items: e.app.findRecordsByFilter('inventory_products', 'merged_into = {:id}', 'merged_at,id', 0, 0, { id: target.id }).map((record) => ({ id: record.id, name: record.getString('name'), sku: record.getString('sku') })) })
}
module.exports = { preview, apply, identities, sources }
