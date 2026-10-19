const policy = require(`${__hooks}/lib/access-policy.js`)
const c = require(`${__hooks}/lib/purchasing-common.js`)
const guard = (app, user, action = 'read') => { const rights = policy.permissions(app, user); if (!rights.includes('inventory.read') || action !== 'read' && (user.getString('erp_profile') === 'viewer' || !rights.includes(`inventory.stock.${action}`))) throw new ForbiddenError('Accès au stock refusé.') }
const sum = (records) => Math.round(records.reduce((total, record) => total + record.getFloat('quantity'), 0) * 1000000) / 1000000
const reservations = (app, order = '') => app.findRecordsByFilter('inventory_reservations', 'active = true' + (order ? ' && order = {:id}' : ''), 'id', 0, 0, { id: order })
const revision = (app, order) => $security.sha256(JSON.stringify(reservations(app, order).map((item) => [item.id, item.getString('updated'), item.getFloat('quantity')])))
const balance = (app, product, location, ownOrder = '') => {
  const params = { product, location, ownOrder }, physical = sum(app.findRecordsByFilter('inventory_moves', 'product = {:product} && location = {:location}', '', 0, 0, params)), reserved = sum(app.findRecordsByFilter('inventory_reservations', 'product = {:product} && location = {:location} && active = true', '', 0, 0, params)), own = ownOrder ? sum(app.findRecordsByFilter('inventory_reservations', 'product = {:product} && location = {:location} && order = {:ownOrder} && active = true', '', 0, 0, params)) : 0
  return { physical, reserved, available: Math.round((physical - reserved + own) * 1000000) / 1000000 }
}
const productAt = (app, id, locationId) => {
  const product = c.get(app, 'inventory_products', id), location = c.get(app, 'inventory_locations', locationId)
  if (!product.getBool('active') || product.getString('stock_policy') === 'none' || !location.getBool('active') || !c.get(app, 'inventory_warehouses', location.getString('warehouse')).getBool('active')) throw new BadRequestError('Produit ou emplacement indisponible pour le stock.')
  return product
}
const audit = (app, user, record, before, label) => { policy.audit(app, record.collection().name, record.id, user.id, before, record.publicExport(), before ? 'update' : 'create'); const product = c.get(app, 'inventory_products', record.getString('product')); require(`${__hooks}/lib/activity.js`).publish(app, product, user.id, 'change', label, { action: before ? 'update' : 'create', quantity: record.getFloat('quantity'), location: record.getString('location'), order: record.getString('order') }) }
const release = (app, user, order) => { for (const item of reservations(app, order.id)) { const before = item.publicExport(); item.set('active', false); app.save(item); audit(app, user, item, before, 'Réservation de stock libérée') } }
const reserve = (app, user, order, selections) => {
  if (!Array.isArray(selections) || selections.length > 200) throw new BadRequestError('Réservations invalides.')
  if (selections.length || reservations(app, order.id).length) guard(app, user, 'reserve')
  if (order.getString('status') !== 'confirmed') throw new BadRequestError('Réservez uniquement sur une commande client confirmée.')
  const lines = app.findRecordsByFilter('sales_order_lines', 'order = {:id} && kind = "item"', 'position', 0, 0, { id: order.id }), seen = new Set(), totals = new Map(), places = new Map()
  for (const selection of selections) {
    c.exact(selection, ['source_line', 'location', 'quantity', 'lot', 'serial']); const line = lines.find((item) => item.getString('source_line') === selection.source_line)
    if (!line || !line.getString('product')) throw new BadRequestError('Ligne de commande invalide pour une réservation.')
    productAt(app, line.getString('product'), selection.location); c.number(selection.quantity, 0.000001, 1000000)
    const key = line.id + '-' + selection.location + '-' + (selection.lot || selection.serial || ''); if (seen.has(key)) throw new BadRequestError('Emplacement répété sur une ligne.'); seen.add(key)
    const pendingTrace = selections.slice(0, selections.indexOf(selection)).filter((item) => item.location === selection.location && item.lot === selection.lot && item.serial === selection.serial && lines.find((row) => row.getString('source_line') === item.source_line)?.getString('product') === line.getString('product')).reduce((sum, item) => sum + item.quantity, 0); require(`${__hooks}/lib/stock-traces.js`).validateReservation(app, c.get(app, 'inventory_products', line.getString('product')), selection, order.id, pendingTrace)
    totals.set(line.id, (totals.get(line.id) || 0) + selection.quantity)
    const place = line.getString('product') + '-' + selection.location; if (!places.has(place)) places.set(place, { product: line.getString('product'), location: selection.location, quantity: 0 }); places.get(place).quantity += selection.quantity
  }
  for (const line of lines) { const requested = Math.max(0, c.requested(app, line.id) - require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, line.id)) + require(`${__hooks}/lib/stock-operations.js`).deliveryTracking(app, order.getString('quote'), line.id).delivered; if ((totals.get(line.id) || 0) + requested > line.getFloat('quantity') + 0.000001) throw new ApiError(409, 'Une partie de cette quantité est déjà réservée aux achats. Réduisez ou annulez la demande d’achat.') }
  for (const place of places.values()) if (place.quantity > balance(app, place.product, place.location, order.id).available + 0.000001) throw new ApiError(409, 'Le stock disponible a changé. Rechargez les réservations.')
  release(app, user, order)
  for (const selection of selections) { const line = lines.find((item) => item.getString('source_line') === selection.source_line), record = new Record(app.findCollectionByNameOrId('inventory_reservations')); for (const [key, value] of Object.entries({ order: order.id, order_line: line.id, product: line.getString('product'), location: selection.location, quantity: selection.quantity, lot: selection.lot || '', serial: selection.serial || '', active: true, actor: user.id })) record.set(key, value); app.save(record); audit(app, user, record, null, `Stock réservé · ${selection.quantity} ${line.getString('unit')}`) }
}
module.exports = {
  guard, balance, reserve, release,
  productReservations(event) {
    guard(event.app, event.auth)
    const app = event.app, product = c.get(app, 'inventory_products', event.request.pathValue('id'))
    const records = app.findRecordsByFilter('inventory_reservations', 'product = {:id} && active = true && location.active = true && location.warehouse.active = true', '-created,id', 0, 0, { id: product.id })
    const items = records.map((record) => {
      const order = c.get(app, 'sales_orders', record.getString('order')), quote = c.get(app, 'sales_quotes', order.getString('quote'))
      const account = c.get(app, 'accounting_analytic_accounts', order.getString('analytic_account')), company = c.get(app, 'contacts_companies', order.getString('company'))
      const location = c.get(app, 'inventory_locations', record.getString('location')), warehouse = c.get(app, 'inventory_warehouses', location.getString('warehouse'))
      const actor = app.findRecordsByFilter('core_users', 'id = {:id}', '', 1, 0, { id: record.getString('actor') })[0]
      return { id: record.id, quantity: record.getFloat('quantity'), actor: actor?.getString('name') || 'Ancien utilisateur', created: record.getString('created'), order_number: quote.getString('quote_number'), affair_code: account.getString('code'), client: company.getString('name'), location: `${warehouse.getString('name')} · ${location.getString('name')}` }
    })
    return event.json(200, { items })
  },
  balancesByProduct(app, user, ids) {
    guard(app, user)
    if (!ids.length) return new Map()
    const params = Object.fromEntries(ids.map((id, index) => ['p' + index, id]))
    const placeholders = ids.map((_, index) => '{:p' + index + '}').join(',')
    const rows = arrayOf(new DynamicModel({ product: '', physical: 0.1, reserved: 0.1 }))
    app.db().newQuery(`SELECT quantities.product, SUM(quantities.physical) AS physical, SUM(quantities.reserved) AS reserved
      FROM (SELECT product, location, quantity AS physical, 0 AS reserved FROM inventory_moves
        UNION ALL SELECT product, location, 0 AS physical, quantity AS reserved FROM inventory_reservations WHERE active = true) quantities
      JOIN inventory_locations location ON location.id = quantities.location
      JOIN inventory_warehouses warehouse ON warehouse.id = location.warehouse
      WHERE location.active = true AND warehouse.active = true AND quantities.product IN (${placeholders})
      GROUP BY quantities.product`).bind(params).all(rows)
    return new Map(rows.map((row) => [row.product, { physical: Math.round(row.physical * 1000000) / 1000000, reserved: Math.round(row.reserved * 1000000) / 1000000, available: Math.round((row.physical - row.reserved) * 1000000) / 1000000 }]))
  },
  availableByProduct(app, user, ids) { return new Map([...this.balancesByProduct(app, user, ids)].map(([id, value]) => [id, value.available])) },
  choices(event) { guard(event.app, event.auth); const app = event.app; return event.json(200, { locations: app.findRecordsByFilter('inventory_locations', 'active = true && warehouse.active = true', 'warehouse.name,name', 500, 0).map((item) => ({ id: item.id, name: `${c.get(app, 'inventory_warehouses', item.getString('warehouse')).getString('name')} · ${item.getString('name')}` })), warehouses: app.findRecordsByFilter('inventory_warehouses', 'active = true', 'name', 500, 0).map((item) => ({ id: item.id, name: item.getString('name') })), products: app.findRecordsByFilter('inventory_products', 'active = true && stock_policy != "none"', 'name', 500, 0).map((item) => ({ id: item.id, name: `${item.getString('manufacturer')} · ${item.getString('sku')} · ${item.getString('name')}` })) }) },
  list(event) {
    const perPage = require(`${__hooks}/lib/list-page-size.js`)(event.requestInfo().query.perPage)
    guard(event.app, event.auth)
    const app = event.app, query = event.requestInfo().query
    c.exact(query, ['q', 'product', 'location', 'availability', 'page', 'perPage', 'sort', 'group'])
    const availability = require(`${__hooks}/lib/stock-list-filters.js`).values(query.availability, ['physical', 'reserved', 'available'], 'Disponibilité')
    const params = { q: String(query.q || '').slice(0, 200), product: query.product || '' }
    const filter = 'active = true && stock_policy != "none"' + (query.product ? ' && id = {:product}' : '')
    const products = app.findRecordsByFilter('inventory_products', filter, require(`${__hooks}/lib/list-sorting.js`).sql(query.sort, ['name', 'sku'], 'name') + ',id', 10001, 0, params)
    if (products.length > 10000) throw new BadRequestError('Affinez les filtres pour limiter le stock à 10 000 produits.')
    const locations = app.findRecordsByFilter('inventory_locations', 'active = true && warehouse.active = true' + (query.location ? ' && id = {:id}' : ''), 'name', 500, 0, { id: query.location || '' })
    const quantities = (table, condition) => {
      const rows = arrayOf(new DynamicModel({ product: '', location: '', quantity: 0.1 }))
      app.db().newQuery(`SELECT product, location, SUM(quantity) AS quantity FROM ${table} ${condition} GROUP BY product, location`).all(rows)
      return new Map(rows.map((row) => [row.product + '-' + row.location, Math.round(row.quantity * 1000000) / 1000000]))
    }
    const physical = quantities('inventory_moves', ''), reserved = quantities('inventory_reservations', 'WHERE active = true')
    const at = (product, location) => {
      const key = product + '-' + location, present = physical.get(key) || 0, held = reserved.get(key) || 0
      return { physical: present, reserved: held, available: Math.round((present - held) * 1000000) / 1000000 }
    }
    const summary = { all: 0, physical: 0, reserved: 0, available: 0 }, matches = []
    const search = String(query.q || '').slice(0, 200).toLocaleLowerCase()
    const warehouseNames = new Map(app.findRecordsByFilter('inventory_warehouses', 'active = true', '', 500, 0).map((item) => [item.id, item.getString('name')]))
    const locationMatches = (location) => !search || [location.getString('name'), location.getString('code'), warehouseNames.get(location.getString('warehouse')) || ''].join(' ').toLocaleLowerCase().includes(search)
    const matchingPlaces = locations.filter(locationMatches)
    for (const product of products) {
      const productMatches = !search || [product.getString('name'), product.getString('sku'), product.getString('manufacturer')].join(' ').toLocaleLowerCase().includes(search)
      const places = productMatches ? locations : matchingPlaces
      if (!places.length) continue
      summary.all++
      const flags = { physical: false, reserved: false, available: false }, matchingLocations = []
      for (const location of places) {
        const row = at(product.id, location.id)
        for (const key of Object.keys(flags)) if (row[key] > 0) flags[key] = true
        if (!availability.length || availability.some((value) => row[value] > 0)) matchingLocations.push(location)
      }
      for (const key of Object.keys(flags)) if (flags[key]) summary[key]++
      if (matchingLocations.length) matches.push({ product, locations: matchingLocations })
    }
    const page = Math.max(1, Number(query.page) || 1), items = []
    const names = new Map(locations.map((location) => [location.id, `${c.get(app, 'inventory_warehouses', location.getString('warehouse')).getString('name')} · ${location.getString('name')}`]))
    const units = new Map(app.findAllRecords('inventory_units').map((record) => [record.id, record.getString('code')]))
    const productsById = new Map(matches.map((match) => [match.product.id, match.product])), incomingValues = new Map(), valuationValues = new Map()
    const incomingFor = (id) => { if (!incomingValues.has(id)) incomingValues.set(id, require(`${__hooks}/lib/purchasing.js`).incoming(app, event.auth, id)); return incomingValues.get(id) }
    const valuationFor = (item) => { if (!valuationValues.has(item.id)) valuationValues.set(item.id, require(`${__hooks}/lib/stock-valuation.js`).projection(app, productsById.get(item.product), item.location)); return valuationValues.get(item.id) }
    for (const match of matches) {
      const product = match.product, unit = units.get(product.getString('base_unit')) || ''
      for (const location of match.locations) {
        items.push({ id: product.id + '-' + location.id, product: product.id, name: product.getString('name'), reference: product.getString('sku'), brand: product.getString('manufacturer'), unit, location: location.id, location_name: names.get(location.id), ...at(product.id, location.id) })
        if (items.length > 10000) throw new BadRequestError('Affinez les filtres pour limiter les disponibilités à 10 000 lignes.')
      }
    }
    require(`${__hooks}/lib/list-sorting.js`).rows(items, query.sort, ['name', 'sku', 'brand', 'location_name', 'physical', 'reserved', 'available', 'incoming', 'unit', 'valuation'], 'name', (item, field) => field === 'sku' ? item.reference : field === 'incoming' ? incomingFor(item.product) : field === 'valuation' ? valuationFor(item).valuation : item[field])

    const total = items.length
    return event.json(200, { items: items.slice((page - 1) * perPage, page * perPage).map((item) => ({ ...item, ...valuationFor(item), incoming: incomingFor(item.product) })), page, totalItems: total, totalPages: Math.max(1, Math.ceil(total / perPage)), summary })
  },
  adjust(event) { guard(event.app, event.auth, 'adjust'); const body = event.requestInfo().body; c.exact(body, ['product', 'location', 'physical', 'expected', 'reason', 'operation_key']); let result
    event.app.runInTransaction((app) => { guard(app, event.auth, 'adjust'); const product = productAt(app, body.product, body.location); if (product.getString('tracking') !== 'none') throw new BadRequestError('Corrigez un produit tracé avec un inventaire détaillé par identité.'); c.number(body.physical, 0, 1000000); c.number(body.expected, 0, 1000000); c.text(body.reason, 2000, true); if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.operation_key || '')) throw new BadRequestError('Clé d’opération invalide.'); const previous = app.findRecordsByFilter('inventory_moves', 'operation_key = {:key}', '', 1, 0, { key: body.operation_key })[0]; if (previous) { if (previous.getString('actor') !== event.auth.id || previous.getString('product') !== body.product || previous.getString('location') !== body.location || Math.abs(previous.getFloat('quantity') - (body.physical - body.expected)) > 0.000001 || previous.getString('reason') !== body.reason.trim()) throw new ApiError(409, 'Cette opération existe avec d’autres valeurs.'); result = balance(app, body.product, body.location); return }
      require(`${__hooks}/lib/stock-operations.js`).lockCheck(app, [body.location]); const current = balance(app, body.product, body.location); if (Math.abs(current.physical - body.expected) > 0.000001) throw new ApiError(409, 'Le stock a changé. Rechargez le solde.'); if (body.physical + 0.000001 < current.reserved) throw new BadRequestError('Le stock physique ne peut pas être inférieur aux réservations.'); const movement = new Record(app.findCollectionByNameOrId('inventory_moves')); for (const [key, value] of Object.entries({ product: product.id, location: body.location, quantity: Math.round((body.physical - current.physical) * 1000000) / 1000000, unit: c.get(app, 'inventory_units', product.getString('base_unit')).getString('code'), kind: 'adjustment', reason: body.reason.trim(), operation_key: body.operation_key, actor: event.auth.id })) movement.set(key, value); require(`${__hooks}/lib/stock-valuation.js`).post(app, event.auth, movement); audit(app, event.auth, movement, null, `Stock ajusté · ${current.physical} → ${body.physical}`); result = balance(app, product.id, body.location)
    }); return event.json(200, result)
  },
  reservationChoices(event) { guard(event.app, event.auth); const app = event.app, id = event.request.pathValue('id'); if (!policy.permissions(app, event.auth).includes('sales.read')) throw new ForbiddenError('Accès aux ventes nécessaire.'); const quote = c.get(app, 'sales_quotes', id); if (!['validated', 'sent', 'accepted'].includes(quote.getString('status')) || quote.getString('archived_at')) throw new BadRequestError('Finalisez le devis avant de réserver.'); const order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status = "confirmed"', '-created', 1, 0, { id })[0], own = order ? reservations(app, order.id) : [], locations = app.findRecordsByFilter('inventory_locations', 'active = true && warehouse.active = true', 'warehouse.name,name', 500, 0)
    return event.json(200, { revision: revision(app, order?.id || 'none'), lines: (order ? app.findRecordsByFilter('sales_order_lines', 'order = {:id} && kind = "item" && product != ""', 'position', 0, 0, { id: order.id }) : app.findRecordsByFilter('sales_quote_lines', 'quote = {:id} && kind = "item" && is_option = false && product != ""', 'position', 0, 0, { id })).flatMap((line) => { const product = c.get(app, 'inventory_products', line.getString('product')); if (product.getString('stock_policy') === 'none') return []; const source = order ? line : null; return [{ source_line: source ? source.getString('source_line') : line.id, description: line.getString('description'), quantity: line.getFloat('quantity'), unit: line.getString('unit'), reservable: true, capacity: Math.max(0, line.getFloat('quantity') - (source ? Math.max(0, c.requested(app, source.id) - require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, source.id)) + require(`${__hooks}/lib/stock-operations.js`).deliveryTracking(app, quote.id, source.id).delivered : 0)), locations: locations.flatMap((location) => { const name = `${c.get(app, 'inventory_warehouses', location.getString('warehouse')).getString('name')} · ${location.getString('name')}`; return product.getString('tracking') === 'none' ? [{ id: location.id, name, lot: '', serial: '', ...balance(app, product.id, location.id, order?.id || '') }] : require(`${__hooks}/lib/stock-traces.js`).choices(app, product, location.id, order?.id || '').filter((trace) => trace.physical > 0 || trace.reserved > 0).map((trace) => ({ ...trace, id: location.id, name: name + ' · ' + trace.number })) }), selected: own.filter((item) => item.getString('order_line') === source?.id).map((item) => ({ location: item.getString('location'), quantity: item.getFloat('quantity'), lot: item.getString('lot'), serial: item.getString('serial') })) }] }) })
  },
  saveReservations(event) { guard(event.app, event.auth, 'reserve'); const body = event.requestInfo().body; c.exact(body, ['quote', 'revision', 'selections']); let result
    event.app.runInTransaction((app) => { guard(app, event.auth, 'reserve'); const { order } = require(`${__hooks}/lib/sales-procurement.js`)(app, event.auth, body.quote); if (revision(app, order.id) !== body.revision) throw new ApiError(409, 'Les réservations ont changé. Rechargez-les.'); reserve(app, event.auth, order, body.selections); result = { saved: true } }); return event.json(200, result)
  },
  createLocation(event) { if (!policy.settings(event.app, event.auth)) throw new ForbiddenError('Paramétrage réservé aux administrateurs habilités.'); const body = event.requestInfo().body; c.exact(body, ['warehouse', 'code', 'name']); const record = new Record(event.app.findCollectionByNameOrId('inventory_locations')); c.get(event.app, 'inventory_warehouses', body.warehouse); record.set('warehouse', body.warehouse); record.set('code', c.text(body.code, 40, true)); record.set('name', c.text(body.name, 120, true)); record.set('active', true); event.app.save(record); policy.audit(event.app, 'inventory_locations', record.id, event.auth.id, null, record.publicExport(), 'create'); return event.json(200, { saved: true }) },
}

module.exports.deliveryChoices = (app, user) => {
  c.guard(app, user)
  return app.findRecordsByFilter('inventory_warehouses', 'active = true', 'name,id', 500, 0).map((record) => ({ id: record.id, code: record.getString('code'), name: record.getString('name') }))
}
module.exports.deliveryWarehouse = (app, user, id, requireActive = false) => {
  c.guard(app, user)
  const record = c.get(app, 'inventory_warehouses', id)
  if (requireActive && !record.getBool('active')) throw new BadRequestError('Choisissez un entrepôt de livraison actif.')
  return { id: record.id, code: record.getString('code'), name: record.getString('name') }
}

module.exports.defaultDeliveryWarehouse = (app, user) => {
  const warehouses = module.exports.deliveryChoices(app, user)
  return warehouses.find((item) => item.code === 'MEU')?.id || (warehouses.length === 1 ? warehouses[0].id : '')
}
