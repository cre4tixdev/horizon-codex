const c = require(`${__hooks}/lib/purchasing-common.js`)
const round = (value) => Math.round(value * 1000000) / 1000000
const ids = (trace) => { const result = { lot: trace.lot || '', serial: trace.serial || '' }; for (const value of Object.values(result)) if (typeof value !== 'string' || value && !/^[a-z0-9]{15}$/.test(value)) throw new BadRequestError('Identité de traçabilité invalide.'); return result }
const balance = (app, product, place, trace, ownOrder = '') => {
  const params = { product, place, ...ids(trace), own: ownOrder }
  const moves = app.findRecordsByFilter('inventory_trace_moves', 'product = {:product} && lot = {:lot} && serial = {:serial}' + (place ? ' && location = {:place}' : ''), '', 0, 0, params)
  const reservations = app.findRecordsByFilter('inventory_reservations', 'product = {:product} && lot = {:lot} && serial = {:serial} && active = true' + (place ? ' && location = {:place}' : ''), '', 0, 0, params)
  const physical = round(moves.reduce((sum, item) => sum + item.getFloat('quantity'), 0)), reserved = round(reservations.reduce((sum, item) => sum + item.getFloat('quantity'), 0)), own = round(reservations.filter((item) => item.getString('order') === ownOrder).reduce((sum, item) => sum + item.getFloat('quantity'), 0))
  return { physical, reserved, available: round(physical - reserved + own) }
}
const identity = (app, product, trace) => {
  ids(trace)
  if (trace.serial) { const item = c.get(app, 'inventory_serials', trace.serial); if (item.getString('product') !== product.id) throw new BadRequestError('Série étrangère au produit.'); return { item, key: 'serial', number: item.getString('serial_number') } }
  if (trace.lot) { const item = c.get(app, 'inventory_lots', trace.lot); if (item.getString('product') !== product.id) throw new BadRequestError('Lot étranger au produit.'); return { item, key: 'lot', number: item.getString('lot_number') } }
  return null
}
const normalize = (input) => {
  if (input === undefined) return []
  if (!Array.isArray(input) || input.length > 1000) throw new BadRequestError('Limitez la traçabilité à 1000 identités par ligne.')
  return input.map((row) => { c.exact(row, ['lot', 'serial', 'number', 'quantity', 'expiry_date']); const trace = { ...ids(row), number: c.text(row.number || '', 160), quantity: c.number(row.quantity ?? 1, 0, 1000000), expiry_date: c.date(row.expiry_date || '') }; if (trace.lot && trace.serial) throw new BadRequestError('Choisissez un lot ou une série.'); return trace })
}
const choices = (app, product, place = '', ownOrder = '') => {
  const kind = product.getString('tracking')
  if (kind === 'none') return []
  const rows = app.findRecordsByFilter(kind === 'serial' ? 'inventory_serials' : 'inventory_lots', 'product = {:id}', kind === 'serial' ? 'serial_number' : 'lot_number', 2000, 0, { id: product.id })
  if (rows.length >= 2000) throw new BadRequestError('Affinez le produit avant de consulter plus de 2000 identités.')
  return rows.map((item) => {
    const trace = { lot: kind === 'lot' ? item.id : '', serial: kind === 'serial' ? item.id : '' }
    return { ...trace, updated: item.getString('updated'), number: item.getString(kind === 'serial' ? 'serial_number' : 'lot_number'), expiry_date: item.getString('expiry_date'), status: item.getString('status'), location: item.getString('location'), ...balance(app, product.id, place, trace, ownOrder) }
  })
}
const resolve = (app, operation, line, trace, positive) => {
  const product = c.get(app, 'inventory_products', line.product), kind = product.getString('tracking')
  let found = identity(app, product, trace)
  if (!found && trace.number) { const key = kind === 'serial' ? 'serial' : 'lot', collection = kind === 'serial' ? 'inventory_serials' : 'inventory_lots', field = kind === 'serial' ? 'serial_number' : 'lot_number'; const item = app.findRecordsByFilter(collection, `product = {:id} && ${field} = {:number}`, '', 1, 0, { id: product.id, number: trace.number })[0]; if (item) found = { item, key, number: trace.number } }
  const incoming = operation.getString('kind') === 'IN' && positive
  if (found && (incoming || operation.getBool('dropship')) && kind === 'serial') throw new BadRequestError(`Le numéro de série ${found.number} existe déjà. Utilisez un retour lié pour une réentrée.`)
  if (!found) {
    if (!incoming && !operation.getBool('dropship')) throw new BadRequestError('Sélectionnez une identité déjà réceptionnée.')
    if (!trace.number) throw new BadRequestError('Renseignez chaque numéro de lot ou de série.')
    const item = new Record(app.findCollectionByNameOrId(kind === 'serial' ? 'inventory_serials' : 'inventory_lots'))
    item.set('product', product.id); item.set(kind === 'serial' ? 'serial_number' : 'lot_number', trace.number)
    if (kind === 'serial') { item.set('purchase_receipt', operation.id); item.set('status', 'stock') } else { item.set('received_at', new Date().toISOString()); item.set('expiry_date', trace.expiry_date); item.set('status', 'active') }
    app.save(item); found = { item, key: kind === 'serial' ? 'serial' : 'lot', number: trace.number }
  }
  if (kind === 'serial' && found.key !== 'serial' || kind === 'lot' && found.key !== 'lot') throw new BadRequestError('Type de traçabilité incompatible avec le produit.')
  if (kind === 'lot' && found.item.getString('status') !== 'active' && operation.getString('kind') !== 'INV') throw new BadRequestError('Ce lot est bloqué ou clôturé.')
  return { ...trace, lot: found.key === 'lot' ? found.item.id : '', serial: found.key === 'serial' ? found.item.id : '', number: found.number, item: found.item }
}
const returnLimit = (app, operation, line, trace) => {
  if (operation.getString('kind') !== 'RET') return
  const origin = c.get(app, 'inventory_operations', operation.getString('origin')), original = JSON.parse(origin.getString('lines') || '[]').find((item) => item.id === line.origin_line)
  const expected = (original?.traces || []).filter((item) => item.lot === trace.lot && item.serial === trace.serial).reduce((sum, item) => sum + item.quantity, 0)
  // Return lines can have different local ids; read origin_line from their snapshots.
  const returned = app.findRecordsByFilter('inventory_operations', 'origin = {:origin} && status = "done" && id != {:own}', '', 0, 0, { origin: origin.id, own: operation.id }).flatMap((item) => JSON.parse(item.getString('lines') || '[]')).filter((item) => item.origin_line === line.origin_line).flatMap((item) => item.traces || []).filter((item) => item.lot === trace.lot && item.serial === trace.serial).reduce((sum, item) => sum + item.quantity, 0)
  if (trace.quantity + returned > expected + 0.000001) throw new BadRequestError('Le retour dépasse la quantité de cette identité dans la sortie d’origine.')
}
module.exports = {
  normalize, balance, choices,
  post(app, actor, operation, line, place, delta, leg) {
    const product = c.get(app, 'inventory_products', line.product), kind = product.getString('tracking')
    if (kind === 'none') { if (line.traces?.length) throw new BadRequestError('Ce produit ne possède pas de suivi de traçabilité.'); return }
    const raw = normalize(line.traces)
    if (!raw.length || kind === 'serial' && (!Number.isInteger(line.quantity) && operation.getString('kind') !== 'INV' || raw.some((item) => item.quantity !== 1))) throw new BadRequestError('Chaque exemplaire doit avoir un numéro de série et une quantité de 1.')
    if (operation.getString('kind') !== 'INV' && Math.abs(raw.reduce((sum, item) => sum + item.quantity, 0) - line.quantity) > 0.000001) throw new BadRequestError('Les quantités des lots / séries doivent correspondre à la quantité de la ligne.')
    if (operation.getString('kind') === 'INV' && raw.length !== 1) throw new BadRequestError('Une ligne de comptage est dédiée à une seule identité.')
    const seen = new Set(), saved = []
    for (const selection of raw) {
      const trace = resolve(app, operation, line, selection, delta > 0), key = trace.lot || trace.serial
      if (seen.has(key)) throw new BadRequestError('Une identité est répétée sur cette ligne.'); seen.add(key)
      const portion = operation.getString('kind') === 'INV' ? delta : Math.sign(delta) * trace.quantity
      returnLimit(app, operation, line, trace)
      if (kind === 'serial' && Math.abs(portion) !== 1) throw new BadRequestError('Une série correspond à un seul exemplaire.')
      const state = balance(app, product.id, place, trace), own = operation.getString('sales_quote') ? app.findRecordsByFilter('inventory_reservations', 'order.quote = {:quote} && order_line = {:line} && location = {:place} && lot = {:lot} && serial = {:serial} && active = true', '', 0, 0, { quote: operation.getString('sales_quote'), line: line.sales_line || line.source_line, place, ...ids(trace) }).reduce((sum, row) => sum + row.getFloat('quantity'), 0) : 0
      if (portion < 0 && -portion > state.available + own + 0.000001) throw new ApiError(409, 'Lot ou série indisponible ou réservé à une autre commande.')
      if (kind === 'serial' && portion > 0 && balance(app, product.id, '', trace).physical > 0) throw new BadRequestError('Cette série est déjà présente dans cet emplacement.')
      const record = new Record(app.findCollectionByNameOrId('inventory_trace_moves'))
      for (const [field, value] of Object.entries({ operation: operation.id, operation_line: line.id, product: product.id, ...ids(trace), location: place, quantity: portion, leg, entry_key: `${operation.id}-${line.id}-${leg}-${key}`, actor: actor.id })) record.set(field, value)
      app.save(record)
      if (kind === 'serial') { trace.item.set('location', portion > 0 ? place : operation.getString('kind') === 'INT' ? '' : place); trace.item.set('status', portion > 0 ? 'stock' : leg === 'internal-out' ? 'internal' : operation.getString('kind') === 'INV' ? 'missing' : operation.getBool('scrap') ? 'scrapped' : operation.getString('kind') === 'INT' ? 'transit' : operation.getString('kind') === 'RET' ? 'returned' : 'delivered'); if (portion < 0 && operation.getString('sales_quote')) trace.item.set('sales_delivery', operation.id); if (line.allocations?.[0]) trace.item.set('analytic_account', line.allocations[0].analytic_account); app.save(trace.item) }
      const { item, ...output } = trace; void item; saved.push(output)
    }
    line.traces = saved
  },
  dropship(app, user, operation, line) {
    const product = c.get(app, 'inventory_products', line.product), kind = product.getString('tracking'), raw = normalize(line.traces)
    if (kind === 'none') { if (raw.length) throw new BadRequestError('Ce produit n’est pas tracé.'); return }
    if (!raw.length || Math.abs(raw.reduce((sum, trace) => sum + trace.quantity, 0) - line.quantity) > 0.000001 || kind === 'serial' && raw.some((trace) => trace.quantity !== 1)) throw new BadRequestError('Renseignez les identités livrées directement, avec les quantités correspondantes.')
    const seen = new Set(); line.traces = raw.map((selection) => {
      const trace = resolve(app, operation, line, selection, false), key = trace.lot || trace.serial
      if (seen.has(key)) throw new BadRequestError('Identité répétée.'); seen.add(key)
      const record = new Record(app.findCollectionByNameOrId('inventory_trace_moves'))
      for (const [field, value] of Object.entries({ operation: operation.id, operation_line: line.id, product: product.id, ...ids(trace), quantity: 0, leg: 'dropship', entry_key: `${operation.id}-${line.id}-dropship-${key}`, actor: user.id })) record.set(field, value)
      app.save(record)
      if (kind === 'serial') { trace.item.set('status', 'delivered'); trace.item.set('sales_delivery', operation.id); trace.item.set('purchase_receipt', ''); if (line.allocations?.[0]) trace.item.set('analytic_account', line.allocations[0].analytic_account); app.save(trace.item) }
      const { item, ...output } = trace; void item; return output
    })
  },
  history(event) {
    require(`${__hooks}/lib/stock.js`).guard(event.app, event.auth)
    const query = event.requestInfo().query; c.exact(query, ['product', 'lot', 'serial', 'page'])
    const product = c.get(event.app, 'inventory_products', query.product), trace = identity(event.app, product, query)
    if (!trace) throw new BadRequestError('Choisissez un lot ou une série.')
    const page = Math.max(1, Number(query.page) || 1), rows = event.app.findRecordsByFilter('inventory_trace_moves', 'product = {:product} && lot = {:lot} && serial = {:serial}', '-created,id', 0, 0, { product: product.id, ...ids(query) })
    return event.json(200, { page, totalItems: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / 50)), items: rows.slice((page - 1) * 50, page * 50).map((move) => ({ id: move.id, date: move.getString('created'), operation: move.getString('operation'), number: c.get(event.app, 'inventory_operations', move.getString('operation')).getString('number'), kind: c.get(event.app, 'inventory_operations', move.getString('operation')).getString('kind'), quantity: move.getFloat('quantity'), location: move.getString('location') ? c.get(event.app, 'inventory_locations', move.getString('location')).getString('name') : 'Livraison directe', actor: c.get(event.app, 'core_users', move.getString('actor')).getString('name') })) })
  },
  updateLot(event) {
    const stock = require(`${__hooks}/lib/stock.js`); stock.guard(event.app, event.auth); if (event.auth.getString('erp_profile') === 'viewer' || !c.policy.permissions(event.app, event.auth).includes('inventory.write')) throw new ForbiddenError('Droit de gestion du stock nécessaire.')
    const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'status', 'expiry_date']); let saved
    event.app.runInTransaction((app) => { stock.guard(app, event.auth); const record = c.get(app, 'inventory_lots', body.id), before = record.publicExport(); if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le lot a changé. Actualisez-le.'); if (!['active', 'quarantine', 'closed'].includes(body.status)) throw new BadRequestError('État du lot invalide.'); if (body.status === 'closed' && balance(app, record.getString('product'), '', { lot: record.id }).physical !== 0) throw new BadRequestError('Un lot encore en stock ne peut pas être clôturé.'); record.set('status', body.status); record.set('expiry_date', c.date(body.expiry_date || '')); app.save(record); c.policy.audit(app, 'inventory_lots', record.id, event.auth.id, before, record.publicExport(), 'update'); saved = record.publicExport() }); return event.json(200, saved)
  },
  validateReservation(app, product, selection, ownOrder, pending = 0) {
    if (product.getString('tracking') === 'none') { if (selection.lot || selection.serial) throw new BadRequestError('Ce produit n’est pas tracé.'); return }
    const trace = identity(app, product, selection)
    if (!trace || product.getString('tracking') === 'serial' && (trace.key !== 'serial' || selection.quantity !== 1) || product.getString('tracking') === 'lot' && trace.key !== 'lot') throw new BadRequestError('Sélectionnez le lot ou la série à réserver.')
    if (trace.key === 'lot' && trace.item.getString('status') !== 'active') throw new BadRequestError('Ce lot est bloqué.')
    if (selection.quantity + pending > balance(app, product.id, selection.location, selection, ownOrder).available + 0.000001) throw new ApiError(409, 'L’identité sélectionnée n’est plus disponible.')
  },
  read(event) {
    require(`${__hooks}/lib/stock.js`).guard(event.app, event.auth)
    const query = event.requestInfo().query; c.exact(query, ['product', 'location'])
    const product = c.get(event.app, 'inventory_products', query.product), rows = choices(event.app, product, query.location || '')
    return event.json(200, { tracking: product.getString('tracking'), items: rows })
  },
}
