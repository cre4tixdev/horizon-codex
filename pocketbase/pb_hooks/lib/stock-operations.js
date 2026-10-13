const c = require(`${__hooks}/lib/purchasing-common.js`)
const stock = require(`${__hooks}/lib/stock.js`)
const kinds = ['IN', 'OUT', 'RET', 'PREP', 'INT', 'INV']
const read = (app, user) => stock.guard(app, user)
const write = (app, user, validate = false) => { read(app, user); const rights = c.policy.permissions(app, user); if (user.getString('erp_profile') === 'viewer' || !rights.includes('inventory.write') || validate && !rights.includes('inventory.stock.validate')) throw new ForbiddenError('Droits de gestion du stock nécessaires.') }
const lines = (record) => JSON.parse(record.getString('lines') || '[]')
const rounded = (value) => Math.round(value * 1000000) / 1000000
const activeWarehouse = (app, id) => { const record = c.get(app, 'inventory_warehouses', id); if (!record.getBool('active')) throw new BadRequestError('Entrepôt inactif.'); return record }
const location = (app, id, warehouse) => { const record = c.get(app, 'inventory_locations', id); if (!record.getBool('active') || record.getString('warehouse') !== warehouse) throw new BadRequestError('Choisissez un emplacement actif de cet entrepôt.'); return record }
const number = (app, warehouse, kind) => require(`${__hooks}/lib/stock-purchase-receipts.js`).number(app, warehouse, kind)
const ledger = (app, operation, line, place, quantity, leg) => {
  if (!quantity) return
  const allocations = line.allocations?.length ? line.allocations : [{ analytic_account: '', quantity: line.quantity }]
  let remaining = rounded(quantity)
  allocations.forEach((allocation, index) => {
    const portion = index === allocations.length - 1 ? remaining : rounded(quantity * allocation.quantity / line.quantity); remaining = rounded(remaining - portion)
    const record = new Record(app.findCollectionByNameOrId('inventory_moves'))
    for (const [key, value] of Object.entries({ operation: operation.id, product: line.product, location: place, quantity: portion, unit: line.unit, kind: operation.getString('kind'), reason: operation.getString('reason') || operation.getString('number'), actor: operation.getString('validated_by'), source_entity: 'inventory_operations', source_record_id: operation.id, source_line: line.sales_line || line.source_line || '', analytic_account: allocation.analytic_account, operation_key: `${operation.id}-${line.id}-${leg}-${index}` })) record.set(key, value)
    require(`${__hooks}/lib/stock-valuation.js`).post(app, c.get(app, 'core_users', operation.getString('validated_by')), record, operation, line)
  })
  require(`${__hooks}/lib/stock-traces.js`).post(app, c.get(app, 'core_users', operation.getString('validated_by')), operation, line, place, quantity, leg)
  require(`${__hooks}/lib/activity.js`).publish(app, c.get(app, 'inventory_products', line.product), operation.getString('validated_by'), 'change', `${operation.getString('number')} · ${quantity} ${line.unit}`, { action: 'stock', operation: operation.id })
}
const consumed = (app, field, id, kind, sourceLine, exclude = '') => {
  return rounded(app.findRecordsByFilter('inventory_operations', `${field} = {:id} && status = "done" && id != {:exclude}`, '', 0, 0, { id, exclude }).filter((record) => kind.includes(record.getString('kind'))).reduce((sum, record) => sum + lines(record).filter((line) => line.source_line === sourceLine || line.sales_line === sourceLine).reduce((total, line) => total + line.quantity, 0), 0))
}
const lockCheck = (app, ids, exclude = '') => {
  const locks = app.findRecordsByFilter('inventory_operations', 'kind = "INV" && status = "counting" && lock_movements = true && id != {:exclude}', '', 0, 0, { exclude })
  if (locks.some((record) => JSON.parse(record.getString('scope') || '[]').some((id) => ids.includes(id)))) throw new ApiError(409, 'Un inventaire en cours verrouille ces emplacements. Préparez le brouillon ou terminez le comptage.')
}
const dto = (app, user, record, readinessContext) => {
  const rights = c.policy.permissions(app, user), output = record.publicExport(), source = record.getString('opportunity') && rights.includes('crm.read') ? c.get(app, 'crm_opportunities', record.getString('opportunity')) : null
  const opportunityIds = new Set(source ? [source.id] : [])
  if (rights.includes('crm.read')) for (const line of lines(record)) for (const allocation of line.allocations || []) { if (!allocation.analytic_account) continue; const id = app.findRecordById('accounting_analytic_accounts', allocation.analytic_account).getString('opportunity'); if (id) opportunityIds.add(id) }
  const opportunities = [...opportunityIds].sort().map((id) => { const item = app.findRecordById('crm_opportunities', id); return { id, name: `${item.getString('opportunity_number')} · ${item.getString('title')}` } })
  delete output.creation_key; delete output.creation_hash; delete output.document_snapshot; delete output.delivery_matches
  const delivery = require(`${__hooks}/lib/stock-delivery-readiness.js`), ready = delivery.project(record, readinessContext || delivery.context(app, [record]))
  const candidates = !readinessContext && record.getString('kind') === 'IN' && record.getString('status') === 'done' && rights.includes('sales.read') && rights.includes('crm.read') && app.findAllRecords('settings_stock')[0].getBool('auto_prepare_deliveries') ? require(`${__hooks}/lib/stock-deliveries.js`).candidates(app, record).filter((item) => item.options.length !== 1 && !(JSON.parse(record.getString('delivery_matches') || '[]') || []).some((match) => match.line_id === item.line_id && match.analytic_account === item.analytic_account)) : []
  return { ...output, opportunities, readiness: ready, delivery_candidates: candidates, ...require(`${__hooks}/lib/stock-operation-details.js`)(app, record), can_inspect_purchase: rights.includes('purchasing.read'), opportunity: source?.id || '', opportunity_name: source ? `${source.getString('opportunity_number')} · ${source.getString('title')}` : '', warehouse_name: c.get(app, 'inventory_warehouses', record.getString('warehouse')).getString('name'), destination_warehouse_name: record.getString('destination_warehouse') ? c.get(app, 'inventory_warehouses', record.getString('destination_warehouse')).getString('name') : '', purchase_order: record.getString('purchase_order'), sales_quote: rights.includes('sales.read') ? record.getString('sales_quote') : '', lines: lines(record).map((line) => ({ ...line, planned_quantity: line.planned_quantity ?? line.quantity, allocations: rights.includes('crm.read') ? line.allocations : [], unit_cost: rights.includes('purchasing.read') ? line.unit_cost : null })) }
}
const source = (app, user, kind, purchaseId, quoteId, dropship = false, originId = '') => {
  if (!kinds.includes(kind) || kind === 'RET' && (purchaseId || quoteId || dropship)) throw new BadRequestError('Sources incompatibles avec cette opération.')
  if (kind === 'RET' && originId) {
    const origin = c.get(app, 'inventory_operations', originId)
    if (origin.getString('status') !== 'done' || origin.getBool('dropship') || !['IN', 'OUT', 'PREP'].includes(origin.getString('kind'))) throw new BadRequestError('Choisissez une réception ou sortie de stock réalisée.')
    const returns = app.findRecordsByFilter('inventory_operations', 'origin = {:id} && status = "done"', '', 0, 0, { id: originId }).flatMap(lines)
    return { opportunity: origin.getString('opportunity'), warehouse: '', lines: lines(origin).filter((line) => line.product).map((line) => ({ product: line.product, description: line.description, brand: line.brand, reference: line.reference, unit: line.unit, unit_cost: line.unit_cost, tracking: c.get(app, 'inventory_products', line.product).getString('tracking'), purpose: 'stock', traces: [], allocations: line.allocations, source_line: line.source_line, sales_line: line.sales_line, origin_line: line.id, quantity: Math.max(0, rounded(line.quantity - returns.filter((item) => item.origin_line === line.id).reduce((sum, item) => sum + item.quantity, 0))) })).filter((line) => line.quantity > 0) }
  }
  let purchase, sales, sourceLines = [], opportunity = ''
  if (purchaseId) {
    const result = require(`${__hooks}/lib/purchasing-stock-source.js`).source(app, user, purchaseId); purchase = result.record
    sourceLines = result.lines.filter((line) => line.getString('product')).map((line) => ({ source_line: line.id, sales_line: '', product: line.getString('product'), description: line.getString('description'), brand: line.getString('brand'), reference: line.getString('reference'), quantity: Math.max(0, rounded(line.getFloat('quantity') - consumed(app, 'purchase_order', purchaseId, ['IN', 'OUT'], line.id))), unit: line.getString('unit'), unit_cost: line.getFloat('unit_price') * (1 - line.getFloat('discount') / 100), purpose: line.getString('purpose') || 'stock', tracking: c.get(app, 'inventory_products', line.getString('product')).getString('tracking'), traces: [], allocations: c.allocations(app, 'order', line) }))
  }
  if (quoteId) {
    sales = require(`${__hooks}/lib/sales-procurement.js`)(app, user, quoteId); opportunity = sales.quote.getString('opportunity')
    const saleLines = sales.lines.filter((line) => line.getString('product')).map((line) => ({ source_line: line.id, sales_line: line.id, product: line.getString('product'), description: line.getString('description'), brand: line.getString('brand'), reference: line.getString('reference'), quantity: Math.max(0, rounded(line.getFloat('quantity') - consumed(app, 'sales_quote', quoteId, ['OUT', 'PREP'], line.id))), unit: line.getString('unit'), unit_cost: line.getFloat('unit_cost'), tracking: c.get(app, 'inventory_products', line.getString('product')).getString('tracking'), purpose: 'stock', traces: [], allocations: [{ analytic_account: sales.order.getString('analytic_child') || sales.order.getString('analytic_account'), quantity: line.getFloat('quantity') }] }))
    if (!purchaseId) sourceLines = saleLines
    else if (dropship) sourceLines = sourceLines.map((line) => { const matches = saleLines.filter((item) => item.product === line.product); if (matches.length !== 1) throw new BadRequestError('La livraison directe exige une correspondance produit unique avec la commande client.'); return { ...line, sales_line: matches[0].source_line, quantity: Math.min(line.quantity, matches[0].quantity), allocations: matches[0].allocations } })
  }
  if (quoteId && !['OUT', 'PREP'].includes(kind) || purchaseId && kind !== 'IN' && !dropship || dropship && (kind !== 'OUT' || !purchaseId || !quoteId)) throw new BadRequestError('Sources incompatibles avec cette opération.')
  return { opportunity, warehouse: purchase?.getString('delivery_warehouse') || '', lines: sourceLines.filter((line) => line.product && line.quantity > 0) }
}
const normalize = (app, user, input) => {
  c.exact(input, ['kind', 'title', 'warehouse', 'destination_warehouse', 'opportunity', 'purchase_order', 'sales_quote', 'origin', 'destination', 'reason', 'notes', 'document_date', 'planned_date', 'inventory_mode', 'dropship', 'scrap', 'scope', 'lines'])
  if (!kinds.includes(input.kind)) throw new BadRequestError('Type de mouvement invalide.')
  const warehouse = activeWarehouse(app, input.warehouse), result = { kind: input.kind, warehouse: warehouse.id }
  for (const field of ['title', 'destination', 'reason', 'notes']) result[field] = c.text(input[field] || '', field === 'notes' ? 10000 : field === 'reason' ? 2000 : field === 'destination' ? 1000 : 200)
  for (const field of ['document_date', 'planned_date']) result[field] = c.date(input[field] || '')
  result.destination_warehouse = input.destination_warehouse || ''; if (result.destination_warehouse) activeWarehouse(app, result.destination_warehouse)
  result.opportunity = input.opportunity || ''; if (result.opportunity) c.opportunity(app, user, result.opportunity)
  result.purchase_order = input.purchase_order || ''; result.sales_quote = input.sales_quote || ''; result.dropship = input.dropship === true; result.scrap = input.scrap === true
  if (result.scrap && (input.kind !== 'OUT' || result.sales_quote || result.purchase_order) || result.dropship && result.scrap) throw new BadRequestError('Destination de sortie invalide.')
  const origin = source(app, user, input.kind, result.purchase_order, result.sales_quote, result.dropship, input.origin || '')
  if (origin.opportunity) result.opportunity = origin.opportunity
  if (input.origin && c.get(app, 'inventory_operations', input.origin).getBool('internal_use')) throw new BadRequestError('Remettez ce matériel en stock depuis sa fiche Parc interne pour conserver sa qualification comptable.');
  result.origin = input.origin || ''; if (result.origin) { const prior = c.get(app, 'inventory_operations', result.origin); if (prior.getString('status') !== 'done' || (prior.getBool('dropship') || !['IN', 'OUT', 'PREP'].includes(prior.getString('kind'))) || input.kind !== 'RET') throw new BadRequestError('Le retour doit référencer une réception ou une sortie réalisée.'); result.opportunity = prior.getString('opportunity') }
  result.inventory_mode = input.inventory_mode === 'annual' ? 'annual' : 'cycle'
  if (!Array.isArray(input.scope) || input.scope.length > 500) throw new BadRequestError('Périmètre d’inventaire invalide.')
  result.scope = [...new Set(input.scope)]; result.scope.forEach((id) => location(app, id, result.warehouse))
  if (!Array.isArray(input.lines) || input.lines.length > (input.kind === 'INV' ? 2000 : 200)) throw new BadRequestError('Limitez la pièce à 200 lignes.')
  const seen = new Set(), sourceSeen = new Set()
  result.lines = input.lines.map((line, index) => {
    c.exact(line, ['id', 'product', 'quantity', 'from_location', 'to_location', 'source_line', 'sales_line', 'origin_line', 'counted', 'expected', 'description', 'brand', 'reference', 'unit', 'unit_cost', 'allocations', 'traces', 'tracking', 'purpose', 'planned_quantity'])
    const id = line.id || `line-${index + 1}`; if (!/^[a-zA-Z0-9-]{1,64}$/.test(id) || seen.has(id)) throw new BadRequestError('Identifiant de ligne invalide.'); seen.add(id)
    const empty = { id, product: '', description: '', brand: '', reference: '', unit: '', quantity: c.number(line.quantity ?? 0, 0, 1000000), planned_quantity: c.number(line.quantity ?? 0, 0, 1000000), from_location: '', to_location: '', source_line: '', sales_line: '', origin_line: '', unit_cost: 0, allocations: [], counted: line.counted == null ? null : c.number(line.counted, 0, 1000000), expected: 0 }
    if (!line.product) return empty
    const product = c.get(app, 'inventory_products', line.product); if (input.kind !== 'INV' && (!product.getBool('active') || product.getString('stock_policy') === 'none')) throw new BadRequestError('Choisissez un produit géré en stock.')
    const traces = require(`${__hooks}/lib/stock-traces.js`).normalize(line.traces)
    const purpose = line.purpose || 'stock'; if (!['stock', 'consumption', 'internal', 'asset'].includes(purpose)) throw new BadRequestError('Destination interne invalide.')
    const returnMatches = result.origin ? origin.lines.filter((item) => item.product === product.id && (!line.origin_line || item.origin_line === line.origin_line)) : []
    if (returnMatches.length > 1) throw new BadRequestError('Reprenez les lignes de l’opération d’origine pour choisir la ligne à retourner.')
    const linked = result.origin ? returnMatches[0] : line.source_line ? origin.lines.find((item) => item.source_line === line.source_line && item.product === product.id) : null
    if (result.origin && !linked) throw new BadRequestError('Cette ligne n’appartient pas à l’opération d’origine ou est entièrement retournée.')
    if ((result.purchase_order || result.sales_quote) && !linked) throw new BadRequestError('Ligne étrangère à la commande source ou déjà réalisée.')
    if (linked) { if (sourceSeen.has(linked.origin_line || linked.source_line)) throw new BadRequestError('Regroupez les quantités d’une même ligne source.'); sourceSeen.add(linked.origin_line || linked.source_line) }
    if (linked && purpose !== (linked.purpose || 'stock')) throw new BadRequestError('La destination de la ligne source est conservée.'); if (purpose !== 'stock' && input.kind !== 'IN' && (input.kind !== 'OUT' || result.sales_quote || result.dropship)) throw new BadRequestError('L’affectation interne utilise une réception ou une sortie interne.');
    const from = line.from_location || '', to = line.to_location || ''; if (from) location(app, from, result.warehouse); if (to) location(app, to, input.kind === 'INT' ? result.destination_warehouse || result.warehouse : result.warehouse)
    const unit = c.get(app, 'inventory_units', product.getString('base_unit')).getString('code')
    if (linked && linked.unit !== unit) throw new BadRequestError('Convertissez les quantités de la commande dans l’unité de base du produit avant la réception.')
    const returned = result.origin ? lines(c.get(app, 'inventory_operations', result.origin)).find((item) => item.product === product.id) : null
    let allocations = linked?.allocations || returned?.allocations || []
    if (!allocations.length && result.opportunity) allocations = [{ analytic_account: c.get(app, 'crm_opportunities', result.opportunity).getString('analytic_account'), quantity: empty.quantity }]
    const allocationTotal = allocations.reduce((sum, item) => sum + item.quantity, 0)
    allocations = allocations.map((item) => ({ analytic_account: item.analytic_account, quantity: allocationTotal ? rounded(empty.quantity * item.quantity / allocationTotal) : 0 }))
    return { ...empty, traces, tracking: product.getString('tracking'), purpose: linked?.purpose || purpose, product: product.id, description: linked?.description || product.getString('name'), brand: linked?.brand || product.getString('manufacturer'), reference: linked?.reference || product.getString('sku'), unit, from_location: from, to_location: to, source_line: linked?.source_line || '', sales_line: linked?.sales_line || '', origin_line: linked?.origin_line || '', unit_cost: linked?.unit_cost ?? returned?.unit_cost ?? c.number(line.unit_cost ?? product.getFloat('reference_cost'), 0, 1e9), allocations }
  })
  return result
}
const checkRevision = (record, updated) => { if (record.getString('updated') !== updated) throw new ApiError(409, 'Cette pièce a changé. Rechargez-la avant de continuer.') }
const reservationsFor = (app, record, line) => {
  if (!record.getString('sales_quote')) return []
  return app.findRecordsByFilter('inventory_reservations', 'order.quote = {:quote} && order_line = {:line} && location = {:location} && active = true', 'created,id', 0, 0, { quote: record.getString('sales_quote'), line: line.sales_line || line.source_line, location: line.from_location }).filter((item) => !line.traces?.length || line.traces.some((trace) => trace.lot === item.getString('lot') && trace.serial === item.getString('serial')))
}
const execute = (app, user, record, receiving = false) => {
  const allLines = lines(record), kind = record.getString('kind'), supplierReturn = kind === 'RET' && record.getString('origin') && c.get(app, 'inventory_operations', record.getString('origin')).getString('kind') === 'IN', items = allLines.filter((line) => line.product && line.quantity > 0)
  if (!items.length) throw new BadRequestError('Ajoutez un produit et une quantité positive avant validation.'); if (kind === 'IN' && record.getString('purchase_order') && lines(record).some((line) => line.product && !(line.quantity > 0))) throw new BadRequestError('Renseignez une quantité positive pour chaque ligne reçue, ou retirez la ligne non reçue.')
  activeWarehouse(app, record.getString('warehouse'))
  if (kind === 'PREP' && !record.getString('opportunity')) throw new BadRequestError('Une préparation chantier exige une affaire.')
  if ((record.getBool('scrap') || !record.getString('purchase_order') && kind === 'IN' || !record.getString('sales_quote') && kind === 'OUT') && !record.getString('reason').trim()) throw new BadRequestError('Renseignez le motif de ce mouvement.')
  if (kind === 'RET' && !record.getString('origin')) throw new BadRequestError('Choisissez l’opération à l’origine du retour.')
  if (record.getBool('dropship') && !record.getString('reason').trim()) throw new BadRequestError('Renseignez la référence du justificatif de livraison directe, ou ajoutez-le au fil puis indiquez sa référence.')
  const currentSource = source(app, user, kind, record.getString('purchase_order'), record.getString('sales_quote'), record.getBool('dropship'), record.getString('origin'))
  const quantities = new Map()
  if (record.getBool('dropship')) { const saleTotals = new Map(); for (const line of items) saleTotals.set(line.sales_line, (saleTotals.get(line.sales_line) || 0) + line.quantity); const saleSource = source(app, user, 'OUT', '', record.getString('sales_quote')); for (const [id, quantity] of saleTotals) if (quantity > (saleSource.lines.find((line) => line.source_line === id)?.quantity || 0) + 0.000001) throw new BadRequestError('La livraison directe dépasse le reliquat client.') }
  for (const line of items) {
    const product = c.get(app, 'inventory_products', line.product); if (!product.getBool('active') || product.getString('stock_policy') === 'none') throw new BadRequestError('Ce produit n’est plus disponible pour une réalisation de stock.'); if (kind === 'INT') activeWarehouse(app, record.getString('destination_warehouse') || record.getString('warehouse'))
    if (line.unit !== c.get(app, 'inventory_units', product.getString('base_unit')).getString('code')) throw new BadRequestError('Convertissez la quantité dans l’unité de base du produit avant réception.');
    if (line.source_line && kind !== 'RET') { const linked = currentSource.lines.find((item) => item.source_line === line.source_line && item.product === line.product); if (!linked || line.quantity > linked.quantity + 0.000001) throw new ApiError(409, 'Une quantité dépasse le reliquat disponible de la commande source.'); if (line.sales_line !== linked.sales_line) throw new ApiError(409, 'La ligne de commande source a changé.') }
    if (kind === 'RET') { const linked = currentSource.lines.find((item) => item.origin_line === line.origin_line && item.product === line.product); if (!linked || line.quantity > linked.quantity + 0.000001) throw new BadRequestError('Le retour dépasse le reliquat de cette ligne d’origine.') }
    if (record.getBool('dropship')) continue
    const from = (['OUT', 'PREP', 'INT'].includes(kind) || supplierReturn) && !receiving, to = kind === 'IN' || kind === 'RET' && !supplierReturn || kind === 'INT'
    if (from) location(app, line.from_location, record.getString('warehouse'))
    if (to && !line.to_location) throw new BadRequestError('Choisissez une destination pour chaque ligne reçue.'); if (to) location(app, line.to_location, kind === 'INT' ? record.getString('destination_warehouse') || record.getString('warehouse') : record.getString('warehouse'))
    if (kind === 'INT' && line.from_location === line.to_location) throw new BadRequestError('Choisissez deux emplacements distincts.')
    lockCheck(app, [from ? line.from_location : '', to ? line.to_location : ''].filter(Boolean))
    if (from) {
      const key = line.product + '-' + line.from_location, own = reservationsFor(app, record, line).reduce((sum, item) => sum + item.getFloat('quantity'), 0), entry = quantities.get(key) || { product: line.product, location: line.from_location, quantity: 0, own: 0 }; entry.quantity = rounded(entry.quantity + line.quantity); entry.own += Math.min(own, line.quantity); quantities.set(key, entry)
    }
  }
  for (const entry of quantities.values()) { const balance = stock.balance(app, entry.product, entry.location); if (entry.quantity > balance.available + entry.own + 0.000001) throw new ApiError(409, 'Stock insuffisant ou réservé à une autre commande. Rechargez les disponibilités.') }
  record.set('validated_by', user.id); record.set('validated_at', new Date().toISOString())
  const transit = kind === 'INT' && record.getString('destination_warehouse') && record.getString('destination_warehouse') !== record.getString('warehouse') && !receiving
  for (const line of items) {
    if (record.getBool('dropship')) { require(`${__hooks}/lib/stock-traces.js`).dropship(app, user, record, line); continue }
    if ((['OUT', 'PREP', 'INT'].includes(kind) || supplierReturn) && !receiving) {
      ledger(app, record, line, line.from_location, -line.quantity, 'out')
      let left = line.quantity
      for (const reservation of reservationsFor(app, record, line)) { if (left <= 0) break; const before = reservation.publicExport(), used = Math.min(left, reservation.getFloat('quantity')); left -= used; reservation.set('quantity', reservation.getFloat('quantity') - used || reservation.getFloat('quantity')); if (used === before.quantity) reservation.set('active', false); app.save(reservation); c.policy.audit(app, 'inventory_reservations', reservation.id, user.id, before, reservation.publicExport(), 'update') }
    }
    if (kind === 'IN' || kind === 'RET' && !supplierReturn || kind === 'INT' && !transit) ledger(app, record, line, line.to_location, line.quantity, 'in')
  }
  record.set('lines', allLines); record.set('internal_use', kind === 'OUT' && items.some((line) => line.purpose && line.purpose !== 'stock')); record.set('status', transit ? 'transit' : 'done'); app.save(record)
  if (!receiving && kind === 'OUT') require(`${__hooks}/lib/internal-assets.js`).fromOperation(app, user, record)
  if (kind === 'IN') require(`${__hooks}/lib/internal-assets.js`).receive(app, user, record)
  if (!JSON.parse(record.getString('document_snapshot') || 'null')) { record.set('document_snapshot', require(`${__hooks}/lib/stock-document-context.js`)(app, user, record.id).fields); app.save(record) }
  if (record.getString('purchase_order')) require(`${__hooks}/lib/purchasing-stock-source.js`).refresh(app, user, record.getString('purchase_order'))
  if (kind === 'IN') { try { require(`${__hooks}/lib/stock-deliveries.js`).fromReceipt(app, user, record) } catch (error) { console.error('[stock-deliveries] Receipt preparation failed', String(error)); throw error } }
  if (kind === 'OUT' && record.getString('sales_quote') && !record.getBool('dropship')) require(`${__hooks}/lib/stock-deliveries.js`).sync(app, user, record.getString('sales_quote'), record.getString('warehouse'), record.id)
}
module.exports = {
  consumed, lockCheck, execute, ledger,
  prepareDelivery(event) {
    write(event.app, event.auth); const body = event.requestInfo().body; c.exact(body, ['sales_quote', 'warehouse']); let output
    event.app.runInTransaction((app) => {
      write(app, event.auth); require(`${__hooks}/lib/sales-procurement.js`)(app, event.auth, body.sales_quote)
      const warehouses = app.findRecordsByFilter('inventory_warehouses', 'active = true', 'code,id', 0, 0)
      const warehouse = body.warehouse || warehouses.find((row) => row.getString('code') === 'MEU')?.id || (warehouses.length === 1 ? warehouses[0].id : '')
      if (!warehouse) throw new BadRequestError('Choisissez un entrepôt pour préparer la livraison.')
      activeWarehouse(app, warehouse)
      const record = require(`${__hooks}/lib/stock-deliveries.js`).sync(app, event.auth, body.sales_quote, warehouse)
      if (!record) throw new ApiError(409, 'Cette commande est déjà entièrement livrée ou préparée.')
      output = dto(app, event.auth, record)
    }); return event.json(200, output)
  },
  prepareReceiptDeliveries(event) {
    write(event.app, event.auth); const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'matches']); let output
    if (!c.policy.permissions(event.app, event.auth).includes('sales.read') || !c.policy.permissions(event.app, event.auth).includes('crm.read')) throw new ForbiddenError('Accès aux commandes clients nécessaire.')
    if (!Array.isArray(body.matches) || !body.matches.length || body.matches.length > 200) throw new BadRequestError('Sélectionnez les commandes à livrer.')
    event.app.runInTransaction((app) => {
      write(app, event.auth); const record = c.get(app, 'inventory_operations', body.id); checkRevision(record, body.updated)
      if (record.getString('kind') !== 'IN' || record.getString('status') !== 'done' || record.getString('archived_at')) throw new BadRequestError('Choisissez une réception réalisée active.')
      if (!app.findAllRecords('settings_stock')[0].getBool('auto_prepare_deliveries')) throw new BadRequestError('Activez la préparation des BL dans les paramètres Stock.')
      const candidates = require(`${__hooks}/lib/stock-deliveries.js`).candidates(app, record), seen = new Set()
      for (const match of body.matches) {
        c.exact(match, ['line_id', 'analytic_account', 'sales_quote', 'sales_line']); const key = `${match.line_id}/${match.analytic_account}`
        if (seen.has(key) || !candidates.some((candidate) => candidate.line_id === match.line_id && candidate.analytic_account === match.analytic_account && candidate.options.some((item) => item.sales_quote === match.sales_quote && item.sales_line === match.sales_line))) throw new BadRequestError('Rattachement de livraison invalide ou répété.')
        seen.add(key)
      }
      const before = record.publicExport(), previous = (JSON.parse(record.getString('delivery_matches') || '[]') || [])
      const matches = [...previous.filter((item) => !seen.has(`${item.line_id}/${item.analytic_account}`)), ...body.matches]
      record.set('delivery_matches', matches); app.save(record)
      require(`${__hooks}/lib/stock-deliveries.js`).fromReceipt(app, event.auth, record, body.matches)
      c.audit(app, event.auth, record, before, 'Commandes de livraison affectées à la réception'); output = dto(app, event.auth, record)
    }); return event.json(200, output)
  },
  syncPurchase(app, user, order) {
    const source = require(`${__hooks}/lib/purchasing-stock-source.js`).receiptData(app, order)
    require(`${__hooks}/lib/stock-purchase-receipts.js`).sync(app, source, user.id, (record, before, label) => c.audit(app, user, record, before, label))
  },
  choices(event) {
    read(event.app, event.auth); const app = event.app, rights = c.policy.permissions(app, event.auth)
    const warehouseItems = app.findRecordsByFilter('inventory_warehouses', 'active = true', 'name', 500, 0).map((item) => ({ id: item.id, name: item.getString('name'), code: item.getString('code') }))
    return event.json(200, { warehouses: warehouseItems, locations: app.findRecordsByFilter('inventory_locations', 'active = true && warehouse.active = true', 'warehouse.name,name', 500, 0).map((item) => ({ id: item.id, warehouse: item.getString('warehouse'), code: item.getString('code'), name: item.getString('name') })), opportunities: rights.includes('crm.read') ? app.findRecordsByFilter('crm_opportunities', 'active = true', '-created', 500, 0).map((item) => ({ id: item.id, name: `${item.getString('opportunity_number')} · ${item.getString('title')}` })) : [], purchases: rights.includes('purchasing.read') ? app.findRecordsByFilter('purchasing_orders', 'status != "draft" && status != "cancelled" && status != "closed" && archived_at = ""', '-created', 500, 0).map((item) => ({ id: item.id, name: item.getString('order_number') + ' · ' + item.getString('title') })) : [], sales: rights.includes('sales.read') ? app.findRecordsByFilter('sales_quotes', 'status = "accepted" && archived_at = ""', '-created', 500, 0).map((item) => ({ id: item.id, name: item.getString('quote_number') + ' · ' + item.getString('title') })) : [], origins: app.findRecordsByFilter('inventory_operations', 'status = "done" && internal_use = false && (kind = "IN" || kind = "OUT" || kind = "PREP")', '-created', 500, 0).map((item) => ({ id: item.id, name: item.getString('number') + ' · ' + item.getString('title'), kind: item.getString('kind') })), default_warehouse: warehouseItems.find((item) => item.code === 'MEU')?.id || warehouseItems[0]?.id || '' })
  },
  list(event) {
    read(event.app, event.auth); const app = event.app, query = event.requestInfo().query; c.exact(query, ['q', 'kind', 'variant', 'status', 'state', 'warehouse', 'opportunity', 'product', 'purchase_order', 'sales_quote', 'page', 'group', 'sort', 'calendar', 'timeline'])
    const values = require(`${__hooks}/lib/stock-list-filters.js`).values
    const selectedKinds = values(query.kind, kinds, 'Opérations'), variants = values(query.variant, ['delivery', 'dropship', 'scrap', 'internal'], 'Sorties'), statuses = values(query.status === 'archived' ? '' : query.status, ['open', 'draft', 'counting', 'transit', 'done', 'cancelled'], 'États')
    const state = query.state || (query.status === 'archived' ? 'archived' : 'active')
    if (!['active', 'archived'].includes(state) || selectedKinds.includes('INV') && selectedKinds.length > 1) throw new BadRequestError('Critères de stock incompatibles.')
    if (variants.length && selectedKinds.length && !selectedKinds.includes('OUT')) throw new BadRequestError('Le filtre Sortie nécessite le type Sortie.')
    const params = {}, parts = []
    for (const field of ['warehouse', 'purchase_order', 'opportunity']) if (query[field]) { parts.push(`${field} = {:${field}}`); params[field] = query[field] }
    const rights = c.policy.permissions(app, event.auth); if (query.opportunity && !rights.includes('crm.read') || query.purchase_order && !rights.includes('purchasing.read') || query.sales_quote && !rights.includes('sales.read')) throw new ForbiddenError('Accès à la pièce source nécessaire.')
    if (query.q) {
      params.q = String(query.q).slice(0, 200)
      const crm = rights.includes('crm.read') ? ' || opportunity.title ~ {:q} || opportunity.opportunity_number ~ {:q}' : ''
      const purchases = rights.includes('purchasing.read') ? ' || purchase_order.order_number ~ {:q} || purchase_order.supplier.name ~ {:q}' : ''
      const sales = rights.includes('sales.read') ? ' || sales_quote.quote_number ~ {:q}' : ''
      // Allocation accounts may contain several affairs; include matching operation IDs.
      const allocated = []
      if (rights.includes('crm.read')) {
        const matches = app.findRecordsByFilter('crm_opportunities', '(title ~ {:q} || opportunity_number ~ {:q})', '', 10001, 0, { q: params.q })
        if (matches.length > 10000) throw new BadRequestError('Affinez la recherche des affaires.')
        const accounts = new Set(matches.map((item) => item.getString('analytic_account')).filter(Boolean))
        if (accounts.size) {
          const candidates = app.findRecordsByFilter('inventory_operations', parts.join(' && ') || 'id != ""', '', 10001, 0, params)
          if (candidates.length > 10000) throw new BadRequestError('Affinez votre recherche.')
          for (const record of candidates) if (lines(record).some((line) => (line.allocations || []).some((allocation) => accounts.has(allocation.analytic_account)))) { const key = `affair${allocated.length}`; params[key] = record.id; allocated.push(`id = {:${key}}`) }
        }
      }
      parts.push(`(number ~ {:q} || title ~ {:q} || destination ~ {:q} || warehouse.name ~ {:q}${crm}${purchases}${sales}${allocated.length ? ' || ' + allocated.join(' || ') : ''})`)
    }
    const records = app.findRecordsByFilter('inventory_operations', parts.join(' && ') || 'id != ""', query.sort === 'number' ? 'number' : query.sort === 'planned_date' ? 'planned_date' : '-created', 10001, 0, params)
    if (records.length > 10000) throw new BadRequestError('Affinez votre recherche.')
    const base = records.filter((record) => !query.sales_quote || record.getString('sales_quote') === query.sales_quote || record.getString('purchase_order') && require(`${__hooks}/lib/purchasing-stock-source.js`).quoteLinks(app, event.auth, record.getString('purchase_order')).includes(query.sales_quote)).filter((record) => (selectedKinds.includes('INV') ? record.getString('kind') === 'INV' : record.getString('kind') !== 'INV')).filter((record) => !query.product || lines(record).some((line) => line.product === query.product)), summary = { IN: 0, OUT: 0, PREP: 0, INT: 0, RET: 0, DS: 0, SCRAP: 0 }
    base.filter((record) => !record.getBool('internal_use') && (state === 'archived' ? !!record.getString('archived_at') : !record.getString('archived_at') && !['done', 'cancelled'].includes(record.getString('status')))).forEach((record) => { const key = record.getBool('scrap') ? 'SCRAP' : record.getBool('dropship') ? 'DS' : record.getString('kind'); if (Object.hasOwn(summary, key)) summary[key]++ })
    const selected = base.filter((record) => !selectedKinds.length || selectedKinds.includes(record.getString('kind'))).filter((record) => !variants.length || record.getString('kind') !== 'OUT' && selectedKinds.length > 1 || record.getString('kind') === 'OUT' && variants.some((variant) => variant === 'dropship' ? record.getBool('dropship') : variant === 'scrap' ? record.getBool('scrap') : variant === 'internal' ? record.getBool('internal_use') : !record.getBool('dropship') && !record.getBool('scrap') && !record.getBool('internal_use'))).filter((record) => (state === 'archived' ? !!record.getString('archived_at') : !record.getString('archived_at')) && (!statuses.length || statuses.some((status) => status === 'open' ? !['done', 'cancelled'].includes(record.getString('status')) : record.getString('status') === status))).sort((a, b) => query.sort === 'planned_date' ? (a.getString('planned_date') || '9999-12-31').localeCompare(b.getString('planned_date') || '9999-12-31') : 0), page = Math.max(1, Number(query.page) || 1), result = query.calendar === 'true' ? selected : selected.slice((page - 1) * 30, page * 30)
    let forecast = null
    if (query.timeline === 'true') {
      const zone = new Timezone('Europe/Paris'), today = new DateTime().time().in(zone).format('2006-01-02')
      forecast = require(`${__hooks}/lib/stock-operation-forecast.js`)(base.filter((record) => !record.getBool('internal_use')).map((record) => ({ kind: record.getString('kind'), status: record.getString('status'), scrap: record.getBool('scrap'), dropship: record.getBool('dropship'), archived: !!record.getString('archived_at'), planned_date: record.getString('planned_date'), completed_date: record.getDateTime('validated_at').isZero() ? '' : record.getDateTime('validated_at').time().in(zone).format('2006-01-02') })), today)
    }
    const readinessContext = require(`${__hooks}/lib/stock-delivery-readiness.js`).context(app, result)
    return event.json(200, { items: result.map((record) => dto(app, event.auth, record, readinessContext)), summary, forecast, page, totalItems: selected.length, totalPages: Math.max(1, Math.ceil(selected.length / 30)) })
  },
  readiness(event) { read(event.app, event.auth); const record = c.get(event.app, 'inventory_operations', event.request.pathValue('id')), delivery = require(`${__hooks}/lib/stock-delivery-readiness.js`); return event.json(200, delivery.project(record, delivery.context(event.app, [record]))) },
  record(event) { read(event.app, event.auth); return event.json(200, dto(event.app, event.auth, c.get(event.app, 'inventory_operations', event.request.pathValue('id')))) },
  source(event) { read(event.app, event.auth); const query = event.requestInfo().query; c.exact(query, ['kind', 'purchase_order', 'sales_quote', 'dropship', 'origin']); const result = source(event.app, event.auth, query.kind, query.purchase_order || '', query.sales_quote || '', query.dropship === 'true', query.origin || ''), rights = c.policy.permissions(event.app, event.auth); return event.json(200, { ...result, opportunity: rights.includes('crm.read') ? result.opportunity : '', lines: result.lines.map((line) => ({ ...line, unit_cost: rights.includes('purchasing.read') ? line.unit_cost : null, allocations: rights.includes('crm.read') ? line.allocations : [] })) }) },
  product(event) { read(event.app, event.auth); const product = c.get(event.app, 'inventory_products', event.request.pathValue('id')); if (product.getString('stock_policy') === 'none') throw new BadRequestError('Ce produit ne possède pas de stock.'); return event.json(200, { id: product.id, description: product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), unit: c.get(event.app, 'inventory_units', product.getString('base_unit')).getString('code'), tracking: product.getString('tracking'), purpose: 'stock', traces: [], unit_cost: require(`${__hooks}/lib/catalog.js`).valuationCost(event.app, product.id) }) },
  save(event) {
    write(event.app, event.auth); const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'creation_key', 'input']); let output
    event.app.runInTransaction((app) => {
      write(app, event.auth); const input = normalize(app, event.auth, body.input)
      require(`${__hooks}/lib/stock-deliveries.js`).checkPrepared(app, input, body.id || '')
      if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
      const hash = c.hash(input), prior = body.id ? c.get(app, 'inventory_operations', body.id) : app.findRecordsByFilter('inventory_operations', 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
      if (prior && !body.id) { if (prior.getString('creation_hash') !== hash || prior.getString('actor') !== event.auth.id) throw new ApiError(409, 'Cette clé existe avec d’autres valeurs.'); output = dto(app, event.auth, prior); return }
      const record = prior || new Record(app.findCollectionByNameOrId('inventory_operations')), before = prior ? prior.publicExport() : null
      if (prior) { checkRevision(record, body.updated); if (!['draft', 'counting'].includes(record.getString('status')) || record.getString('archived_at')) throw new BadRequestError('Cette opération ne peut plus être modifiée.'); if (record.getString('kind') !== input.kind) throw new BadRequestError('Le type de cette opération est conservé.'); if (record.getString('kind') === 'IN' && record.getString('purchase_order') && record.getString('purchase_order') !== input.purchase_order) throw new BadRequestError('La commande fournisseur source est conservée.'); if (record.getString('kind') === 'OUT' && record.getString('sales_quote') && record.getString('sales_quote') !== input.sales_quote) throw new BadRequestError('La commande client source est conservée.'); if (record.getString('warehouse') !== input.warehouse) { if (record.getString('status') !== 'draft' || !(record.getString('kind') === 'IN' && record.getString('purchase_order') || record.getString('kind') === 'OUT' && record.getString('sales_quote'))) throw new BadRequestError('L’entrepôt est conservé pour cette opération.'); record.set('number', number(app, input.warehouse, input.kind)) } }
      else { record.set('number', number(app, input.warehouse, input.kind)); record.set('status', 'draft'); record.set('actor', event.auth.id); record.set('creation_key', body.creation_key); record.set('creation_hash', hash) }
      if (prior?.getString('status') === 'counting') {
        const previous = lines(prior)
        if (input.lines.length !== previous.length || input.lines.some((line, index) => line.id !== previous[index].id || line.product !== previous[index].product || line.from_location !== previous[index].from_location) || JSON.stringify(input.scope) !== record.getString('scope')) throw new BadRequestError('Le périmètre est figé pendant le comptage.')
        input.lines = previous.map((line, index) => ({ ...line, counted: input.lines[index].counted })); for (const field of ['planned_date', 'inventory_mode', 'destination_warehouse', 'purchase_order', 'sales_quote', 'origin', 'opportunity', 'dropship', 'scrap']) input[field] = record.get(field)
      }
      if (prior && record.getString('creation_key').startsWith('sales-delivery-')) record.set('creation_hash', hash)
      for (const [key, value] of Object.entries(input)) record.set(key, value)
      record.set('internal_use', input.kind === 'OUT' && input.lines.some((line) => line.product && line.purpose !== 'stock'))
      app.save(record); c.audit(app, event.auth, record, before, prior ? 'Opération de stock modifiée' : 'Opération de stock créée'); output = dto(app, event.auth, record)
    }); return event.json(200, output)
  },
  transition(event) {
    write(event.app, event.auth, true); const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'action', 'quantities']); let output
    event.app.runInTransaction((app) => {
      write(app, event.auth, true); const record = c.get(app, 'inventory_operations', body.id); checkRevision(record, body.updated); const before = record.publicExport(), status = record.getString('status'), kind = record.getString('kind')
      if (body.action === 'restore' && record.getString('archived_at')) { record.set('archived_at', ''); app.save(record); c.audit(app, event.auth, record, before, 'Opération désarchivée'); output = dto(app, event.auth, record); return }
      if (body.quantities !== undefined && (body.action !== 'validate' || !require(`${__hooks}/lib/stock-delivery-readiness.js`).delivery(record))) throw new BadRequestError('Quantités partielles réservées à la validation d’un BL.');
      if (record.getString('archived_at')) throw new BadRequestError('Cette pièce est archivée.')
      if (body.action === 'archive') { if (!['done', 'cancelled'].includes(status)) throw new BadRequestError('Terminez ou annulez la pièce avant archivage.'); record.set('archived_at', new Date().toISOString()); app.save(record) }
      else if (body.action === 'cancel') { if (!['draft', 'counting'].includes(status)) throw new BadRequestError('Une réalisation ou un transfert en transit se corrige par une opération liée.'); record.set('status', 'cancelled'); app.save(record) }
      else if (body.action === 'start' && kind === 'INV' && status === 'draft') {
        const scope = JSON.parse(record.getString('scope') || '[]'); if (!scope.length) throw new BadRequestError('Choisissez les emplacements à inventorier.'); lockCheck(app, scope)
        const products = app.findRecordsByFilter('inventory_products', 'stock_policy != "none"', 'name,id', 2001, 0)
        const items = []; for (const place of scope) for (const product of products) { const balance = stock.balance(app, product.id, place); if (balance.physical || record.getString('inventory_mode') === 'annual' || product.getString('tracking') !== 'none') items.push({ id: `${product.id}-${place}`, product: product.id, description: product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), unit: c.get(app, 'inventory_units', product.getString('base_unit')).getString('code'), quantity: 0, expected: balance.physical, counted: null, from_location: place, to_location: place, source_line: '', sales_line: '', origin_line: '', unit_cost: product.getFloat('reference_cost'), allocations: [] }) }
        const tracedItems = []; for (const item of items) { const product = c.get(app, 'inventory_products', item.product); if (product.getString('tracking') === 'none') tracedItems.push(item); else for (const trace of require(`${__hooks}/lib/stock-traces.js`).choices(app, product, item.from_location).filter((row) => row.physical > 0 || row.serial && row.status === 'missing' && row.location === item.from_location || row.lot && app.findRecordsByFilter('inventory_trace_moves', 'lot = {:id} && location = {:place}', '', 1, 0, { id: row.lot, place: item.from_location }).length > 0)) tracedItems.push({ ...item, id: `${item.id}-${trace.lot || trace.serial}`, expected: trace.physical, tracking: product.getString('tracking'), purpose: 'stock', traces: [{ lot: trace.lot, serial: trace.serial, number: trace.number, quantity: product.getString('tracking') === 'serial' ? 1 : trace.physical, expiry_date: trace.expiry_date }] }) }; items.splice(0, items.length, ...tracedItems)
        if (!items.length || items.length > 2000) throw new BadRequestError('Périmètre vide ou trop large (2 000 lignes maximum).')
        record.set('lines', items); record.set('lock_movements', app.findAllRecords('settings_stock')[0].getBool('lock_inventory')); record.set('status', 'counting'); app.save(record)
      }
      else if (body.action === 'validate' && kind === 'INV' && status === 'counting') {
        const items = lines(record); record.set('validated_by', event.auth.id); record.set('validated_at', new Date().toISOString())
        for (const line of items) { if (line.counted == null) throw new BadRequestError('Renseignez toutes les quantités comptées.'); const current = line.traces?.length ? require(`${__hooks}/lib/stock-traces.js`).balance(app, line.product, line.from_location, line.traces[0]) : stock.balance(app, line.product, line.from_location); if (Math.abs(current.physical - line.expected) > 0.000001) throw new ApiError(409, 'Le stock a changé pendant le comptage. Annulez puis recommencez le comptage sur ce périmètre.'); if (line.counted + 0.000001 < current.reserved) throw new BadRequestError('Le comptage est inférieur au stock réservé. Réaffectez les réservations avant validation.'); lockCheck(app, [line.from_location], record.id); ledger(app, record, line, line.from_location, rounded(line.counted - line.expected), 'count') }
        record.set('lines', items); record.set('status', 'done'); app.save(record)
      }
      else if (body.action === 'validate' && status === 'draft' && kind !== 'INV') { if (body.quantities !== undefined) require(`${__hooks}/lib/stock-deliveries.js`).partial(record, body.quantities); execute(app, event.auth, record) }
      else if (body.action === 'receive' && status === 'transit' && kind === 'INT') execute(app, event.auth, record, true)
      else throw new BadRequestError('Transition non autorisée.')
      if (record.getString('status') === 'done' && !JSON.parse(record.getString('document_snapshot') || 'null')) { record.set('document_snapshot', require(`${__hooks}/lib/stock-document-context.js`)(app, event.auth, record.id).fields); app.save(record) }
      c.audit(app, event.auth, record, before, ({ validate: 'Réalisation de stock validée', start: 'Comptage démarré', receive: 'Transfert réceptionné', cancel: 'Pièce annulée', archive: 'Pièce archivée', restore: 'Pièce restaurée' })[body.action]); output = dto(app, event.auth, record)
    }); return event.json(200, output)
  },
  settings(event) {
    if (!c.policy.settings(event.app, event.auth)) throw new ForbiddenError('Paramètres réservés aux administrateurs habilités.')
    return event.json(200, { warehouses: event.app.findAllRecords('inventory_warehouses').map((record) => ({ id: record.id, name: record.getString('name'), code: record.getString('code'), active: record.getBool('active') })), lock_inventory: event.app.findAllRecords('settings_stock')[0].getBool('lock_inventory'), auto_prepare_deliveries: event.app.findAllRecords('settings_stock')[0].getBool('auto_prepare_deliveries') })
  },
  saveSettings(event) {
    if (!c.policy.settings(event.app, event.auth)) throw new ForbiddenError('Paramètres réservés aux administrateurs habilités.')
    const body = event.requestInfo().body; c.exact(body, ['warehouses', 'lock_inventory', 'auto_prepare_deliveries']); if (body.auto_prepare_deliveries !== undefined && typeof body.auto_prepare_deliveries !== 'boolean') throw new BadRequestError('Paramètre de livraison invalide.'); if (!Array.isArray(body.warehouses) || !body.warehouses.length || body.warehouses.length > 100 || typeof body.lock_inventory !== 'boolean') throw new BadRequestError('Paramètres invalides.')
    event.app.runInTransaction((app) => {
      const seen = new Set(); for (const input of body.warehouses) {
        c.exact(input, ['id', 'name', 'code', 'active']); if (!/^[A-Z]{3}$/.test(input.code) || seen.has(input.code) || typeof input.active !== 'boolean') throw new BadRequestError('Chaque code doit comporter trois lettres majuscules uniques.'); seen.add(input.code)
        const record = input.id ? c.get(app, 'inventory_warehouses', input.id) : new Record(app.findCollectionByNameOrId('inventory_warehouses')), before = input.id ? record.publicExport() : null
        if (input.id && record.getString('code') !== input.code && app.findRecordsByFilter('inventory_operations', 'warehouse = {:id}', '', 1, 0, { id: input.id }).length) throw new BadRequestError('Le code d’un entrepôt ayant émis des pièces est conservé pour éviter les collisions.')
        if (input.id && !input.active) { const places = app.findRecordsByFilter('inventory_locations', 'warehouse = {:id}', '', 0, 0, { id: input.id }); for (const place of places) { const products = [...new Set(app.findRecordsByFilter('inventory_moves', 'location = {:id}', '', 0, 0, { id: place.id }).map((move) => move.getString('product')))]; if (products.some((id) => stock.balance(app, id, place.id).physical !== 0) || app.findRecordsByFilter('inventory_reservations', 'location = {:id} && active = true', '', 1, 0, { id: place.id }).length) throw new BadRequestError('Videz le stock et libérez les réservations avant de désactiver cet entrepôt.'); } if (app.findRecordsByFilter('inventory_operations', '(warehouse = {:id} || destination_warehouse = {:id}) && status != "done" && status != "cancelled"', '', 1, 0, { id: input.id }).length) throw new BadRequestError('Terminez les opérations de cet entrepôt avant de le désactiver.'); }
        record.set('name', c.text(input.name, 120, true)); record.set('code', input.code); record.set('active', input.active); if (!input.id) record.set('counters', {}); app.save(record); c.policy.audit(app, 'inventory_warehouses', record.id, event.auth.id, before, record.publicExport(), before ? 'update' : 'create')
      }
      const settings = app.findAllRecords('settings_stock')[0], before = settings.publicExport(); settings.set('lock_inventory', body.lock_inventory); if (body.auto_prepare_deliveries !== undefined) settings.set('auto_prepare_deliveries', body.auto_prepare_deliveries); app.save(settings); c.policy.audit(app, 'settings_stock', settings.id, event.auth.id, before, settings.publicExport(), 'update')
    }); return module.exports.settings(event)
  },
}

module.exports.deliveryNeeded = (event) => {
  read(event.app, event.auth); const id = event.request.pathValue('id'); require(`${__hooks}/lib/sales-procurement.js`)(event.app, event.auth, id)
  return event.json(200, { needed: require(`${__hooks}/lib/stock-deliveries.js`).needed(event.app, id) })
}
