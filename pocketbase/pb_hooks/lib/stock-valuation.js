const c = require(`${__hooks}/lib/purchasing-common.js`)
const engine = require(`${__hooks}/lib/stock-valuation-engine.js`)
const method = (app) => app.findAllRecords('settings_stock')[0].getString('valuation_method') || 'standard'
const layers = (record) => JSON.parse(record.getString('layers') || '[]')
const admin = (app, user) => { if (!c.policy.settings(app, user)) throw new ForbiddenError('Valorisation réservée aux administrateurs habilités.') }
const state = (app, product) => app.findRecordsByFilter('inventory_valuation_products', 'product = {:id}', '', 1, 0, { id: product.id })[0]
const physical = (app, product) => {
  const rows = arrayOf(new DynamicModel({ location: '', quantity: 0.1 }))
  app.db().newQuery('SELECT location, SUM(quantity) AS quantity FROM inventory_moves WHERE product = {:id} GROUP BY location').bind({ id: product.id }).all(rows)
  return rows.filter((row) => Math.abs(row.quantity) > 0.000001).map((row) => ({ place: row.location, quantity: engine.round(row.quantity) }))
}
// Transfers started before valuation keep their quantities in an explicit opening position.
const legacyTransit = (app, product) => app.findRecordsByFilter('inventory_operations', 'kind = "INT" && status = "transit"', '', 0, 0).filter((operation) => !app.findRecordsByFilter('inventory_valuation_entries', 'operation = {:id}', '', 1, 0, { id: operation.id }).length).map((operation) => ({ place: `transit:${operation.id}`, quantity: engine.round(JSON.parse(operation.getString('lines') || '[]').filter((line) => line.product === product.id).reduce((sum, line) => sum + line.quantity, 0)) })).filter((row) => row.quantity > 0)
const positions = (app, product) => [...physical(app, product), ...legacyTransit(app, product)]
const create = (app, product, cost) => {
  const record = new Record(app.findCollectionByNameOrId('inventory_valuation_products'))
  record.set('product', product.id); record.set('standard_cost', cost); record.set('layers', []); app.save(record); return record
}
const ready = (app, product) => {
  let record = state(app, product)
  if (!record) {
    if (positions(app, product).length) throw new BadRequestError('Ce produit possède un stock antérieur : validez sa valeur d’ouverture dans Paramètres → Stock.')
    if (product.getString('sale_currency') !== 'EUR') throw new BadRequestError('Définissez le coût standard en EUR dans Paramètres → Stock.')
    const initial = require(`${__hooks}/lib/catalog.js`).valuationCost(app, product.id)
    if (initial === null) throw new BadRequestError('Définissez un coût standard en EUR dans Paramètres → Stock avant la première réalisation.')
    record = create(app, product, initial)
  }
  // Missing pre-module quantities must never be silently valued or mixed with new stock.
  for (const row of positions(app, product)) if (Math.abs(row.quantity - engine.quantity(layers(record).filter((layer) => layer.place === row.place))) > 0.000001) throw new ApiError(409, 'Stock et valorisation ne concordent pas. Validez la valeur d’ouverture de ce produit.')
  return record
}
const entry = (app, user, record, data, before) => {
  const item = new Record(app.findCollectionByNameOrId('inventory_valuation_entries'))
  for (const [key, value] of Object.entries({ product: record.getString('product'), actor: user.id, method: method(app), currency: 'EUR', quantity: 0, movement_value: 0, value_delta: engine.round(engine.value(layers(record)) - engine.value(before)), snapshot: { before, after: layers(record) }, ...data })) item.set(key, value)
  app.save(item)
  return item
}
const dto = (app, product) => {
  const record = state(app, product), current = record ? layers(record) : [], old = positions(app, product), quantity = engine.quantity(current)
  return { product: product.id, name: product.getString('name'), reference: product.getString('sku'), brand: product.getString('manufacturer'), standard_cost: record ? record.getFloat('standard_cost') : require(`${__hooks}/lib/catalog.js`).valuationCost(app, product.id), updated: record?.getString('updated') || '', quantity, physical_quantity: engine.round(old.reduce((sum, row) => sum + row.quantity, 0)), value: engine.value(current), opening_required: old.some((row) => Math.abs(row.quantity - engine.quantity(current.filter((layer) => layer.place === row.place))) > 0.000001), unit: c.get(app, 'inventory_units', product.getString('base_unit')).getString('code') }
}
module.exports = {
  // Called within the transaction, before saving the physical movement.
  post(app, user, move, operation, line) {
    const product = c.get(app, 'inventory_products', move.getString('product')), record = ready(app, product), before = layers(record), delta = move.getFloat('quantity'), place = move.getString('location'), currentMethod = method(app)
    if (operation?.getString('purchase_order') && delta > 0 && c.get(app, 'purchasing_orders', operation.getString('purchase_order')).getString('currency') !== 'EUR') throw new BadRequestError('La valorisation des achats en devise exige un taux de change validé ; utilisez une réception en EUR.')
    let actual = line ? line.unit_cost : record.getFloat('standard_cost'), returned = [], known = Boolean(operation?.getString('purchase_order')) || operation?.getString('kind') === 'IN' && Number.isFinite(line?.unit_cost)
    if (operation?.getString('origin') && delta > 0) {
      const origin = app.findRecordsByFilter('inventory_valuation_entries', 'operation = {:id} && product = {:product} && quantity < 0', 'created,id', 0, 0, { id: operation.getString('origin'), product: product.id }).filter((item) => JSON.parse(item.getString('snapshot') || '{}').line === line.origin_line)
      const original = origin.flatMap((item) => JSON.parse(item.getString('snapshot') || '{}').consumed || []).map((layer) => ({ ...layer, place: 'return' }))
      const previous = app.findRecordsByFilter('inventory_valuation_entries', 'product = {:id} && quantity > 0', '', 0, 0, { id: product.id }).filter((item) => { const snapshot = JSON.parse(item.getString('snapshot') || '{}'); return snapshot.return_origin === operation.getString('origin') && snapshot.return_line === line.origin_line }).reduce((sum, item) => sum + item.getFloat('quantity'), 0)
      if (original.length) {
        const remainder = previous ? engine.take(original, 'return', previous).layers : original
        returned = engine.take(remainder, 'return', delta).consumed
        actual = engine.value(returned) / delta
      } else if (currentMethod !== 'standard') throw new BadRequestError('Le retour doit référencer une sortie valorisée pour retrouver son coût.')
    }
    if (!operation && delta > 0 && currentMethod !== 'standard' && before.length) actual = engine.average(before)
    const transfer = operation?.getString('kind') === 'INT' ? `transit:${operation.id}` : ''
    const result = engine.movement(before, currentMethod, record.getFloat('standard_cost'), place, delta, actual, transfer, Boolean(transfer && delta > 0), returned)
    record.set('layers', result.layers); app.save(record)
    app.save(move)
    entry(app, user, record, { move: move.id, operation: operation?.id || '', location: place, quantity: delta, movement_value: result.movementValue, value_delta: result.valueDelta, actual_known: known, actual_value: known ? engine.round(delta * actual) : 0, variance: known && currentMethod === 'standard' ? engine.round(delta * actual - result.movementValue) : 0, reason: move.getString('reason'), entry_key: move.getString('operation_key'), snapshot: { before, after: result.layers, consumed: result.consumed, line: line?.id || '', return_origin: operation?.getString('origin') || '', return_line: line?.origin_line || '', actual_cost: known ? actual : null } }, before)
  },
  projection(app, product, place) {
    const record = state(app, product), current = record ? layers(record).filter((layer) => layer.place === place) : [], rows = physical(app, product)
    const complete = Math.abs((rows.find((row) => row.place === place)?.quantity || 0) - engine.quantity(current)) <= 0.000001
    return { valuation: complete ? engine.value(current) : null, valuation_method: method(app), valuation_currency: 'EUR' }
  },
  totals(app) {
    const states = app.findAllRecords('inventory_valuation_products'), current = states.flatMap(layers)
    const rows = arrayOf(new DynamicModel({ product: '', location: '', quantity: 0.1 }))
    app.db().newQuery('SELECT product, location, SUM(quantity) AS quantity FROM inventory_moves GROUP BY product,location HAVING ABS(SUM(quantity)) > 0.000001').all(rows)
    const byProduct = new Map(states.map((record) => [record.getString('product'), layers(record)])), missing = new Set()
    for (const row of rows) if (Math.abs(row.quantity - engine.quantity((byProduct.get(row.product) || []).filter((layer) => layer.place === row.location))) > 0.000001) missing.add(row.product)
    for (const operation of app.findRecordsByFilter('inventory_operations', 'kind = "INT" && status = "transit"', '', 0, 0)) {
      if (app.findRecordsByFilter('inventory_valuation_entries', 'operation = {:id}', '', 1, 0, { id: operation.id }).length) continue
      const items = JSON.parse(operation.getString('lines') || '[]'), ids = [...new Set(items.map((line) => line.product).filter(Boolean))]
      for (const id of ids) { const expected = items.filter((line) => line.product === id).reduce((sum, line) => sum + line.quantity, 0), present = engine.quantity((byProduct.get(id) || []).filter((layer) => layer.place === `transit:${operation.id}`)); if (Math.abs(expected - present) > 0.000001) missing.add(id) }
    }
    const incomplete = missing.size
    return { value: engine.value(current), transit_value: engine.value(current.filter((layer) => layer.place.startsWith('transit:'))), incomplete, method: method(app), currency: 'EUR' }
  },
  list(event) {
    require(`${__hooks}/lib/stock.js`).guard(event.app, event.auth)
    const query = event.requestInfo().query; c.exact(query, ['q', 'product', 'page'])
    const products = event.app.findRecordsByFilter('inventory_products', 'stock_policy != "none"' + (query.product ? ' && id = {:id}' : '') + (query.q ? ' && (name ~ {:q} || sku ~ {:q} || manufacturer ~ {:q})' : ''), 'name,id', 10001, 0, { id: query.product || '', q: String(query.q || '').slice(0, 200) })
    if (products.length > 10000) throw new BadRequestError('Affinez la recherche.')
    const page = Math.max(1, Number(query.page) || 1)
    return event.json(200, { ...module.exports.totals(event.app), settings_updated: event.app.findAllRecords('settings_stock')[0].getString('updated'), items: products.slice((page - 1) * 30, page * 30).map((product) => dto(event.app, product)), page, totalPages: Math.max(1, Math.ceil(products.length / 30)) })
  },
  save(event) {
    admin(event.app, event.auth); const body = event.requestInfo().body
    c.exact(body, ['product', 'updated', 'standard_cost', 'reason', 'opening']); c.number(body.standard_cost, 0, 1e9); c.text(body.reason, 2000, true); if (typeof body.opening !== 'boolean') throw new BadRequestError('Choix d’ouverture invalide.')
    event.app.runInTransaction((app) => {
      admin(app, event.auth); const product = c.get(app, 'inventory_products', body.product)
      if (product.getString('stock_policy') === 'none') throw new BadRequestError('Ce produit ne possède pas de stock.')
      let record = state(app, product)
      if ((record?.getString('updated') || '') !== body.updated) throw new ApiError(409, 'Cette valorisation a changé. Rechargez les valeurs.')
      const beforeRecord = record?.publicExport() || null
      if (!record) record = create(app, product, body.standard_cost)
      const before = layers(record)
      const incomplete = dto(app, product).opening_required
      if (incomplete && !body.opening) throw new BadRequestError('Confirmez la valeur d’ouverture du stock antérieur.')
      if (incomplete && before.length) throw new BadRequestError('Ce produit comporte déjà des mouvements valorisés : une correction de reprise dédiée est nécessaire.')
      if (body.opening && incomplete) {
        const rows = positions(app, product); if (rows.some((row) => row.quantity < 0)) throw new BadRequestError('Corrigez les quantités négatives avant ouverture.')
        record.set('layers', rows.map((row) => ({ ...row, cost: body.standard_cost })))
      } else if (method(app) === 'standard') record.set('layers', engine.uniform(before, body.standard_cost))
      record.set('standard_cost', body.standard_cost); app.save(record)
      entry(app, event.auth, record, { reason: body.reason.trim(), entry_key: `cost:${record.id}:${record.getString('updated')}` }, before)
      c.policy.audit(app, 'inventory_valuation_products', record.id, event.auth.id, beforeRecord, record.publicExport(), beforeRecord ? 'update' : 'create')
      require(`${__hooks}/lib/activity.js`).publish(app, product, event.auth.id, 'change', `${incomplete ? 'Valeur d’ouverture validée' : 'Coût standard révisé'} · ${body.standard_cost} EUR / unité`, { action: 'valuation', method: method(app), reason: body.reason.trim() })
    })
    return event.json(200, { saved: true })
  },
  changeMethod(event) {
    admin(event.app, event.auth); const body = event.requestInfo().body; c.exact(body, ['method', 'updated', 'reason']); c.text(body.reason, 2000, true)
    if (!['standard', 'cump', 'fifo'].includes(body.method)) throw new BadRequestError('Méthode invalide.')
    event.app.runInTransaction((app) => {
      admin(app, event.auth); const settings = app.findAllRecords('settings_stock')[0], beforeSettings = settings.publicExport()
      if (settings.getString('updated') !== body.updated) throw new ApiError(409, 'Les paramètres ont changé. Rechargez-les.')
      if (body.method === method(app)) throw new BadRequestError('Cette méthode est déjà active.')
      if (module.exports.totals(app).incomplete) throw new BadRequestError('Validez toutes les valeurs d’ouverture avant de changer de méthode.')
      const transit = app.findRecordsByFilter('inventory_operations', 'status = "transit"', '', 1, 0)
      if (transit.length) throw new BadRequestError('Réceptionnez les transferts en transit avant de changer de méthode.')
      const previousMethod = method(app)
      settings.set('valuation_method', body.method); app.save(settings)
      for (const record of app.findAllRecords('inventory_valuation_products')) {
        const before = layers(record); record.set('layers', engine.change(before, body.method, record.getFloat('standard_cost'))); app.save(record)
        entry(app, event.auth, record, { reason: `${previousMethod} → ${body.method} · ${body.reason.trim()}`, entry_key: `method:${record.id}:${settings.getString('updated')}` }, before)
      }
      c.policy.audit(app, 'settings_stock', settings.id, event.auth.id, beforeSettings, settings.publicExport(), 'update')
    })
    return event.json(200, { saved: true })
  },
  history(event) {
    require(`${__hooks}/lib/stock.js`).guard(event.app, event.auth)
    const query = event.requestInfo().query; c.exact(query, ['product'])
    c.get(event.app, 'inventory_products', query.product)
    return event.json(200, { items: event.app.findRecordsByFilter('inventory_valuation_entries', 'product = {:id}', '-created,-id', 100, 0, { id: query.product }).map((item) => { const output = item.publicExport(); delete output.snapshot; delete output.entry_key; if (!c.policy.permissions(event.app, event.auth).includes('purchasing.read')) { output.actual_value = null; output.variance = null; output.actual_known = false }; return output }) })
  },
}
