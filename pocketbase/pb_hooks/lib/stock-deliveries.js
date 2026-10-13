const c = require(`${__hooks}/lib/purchasing-common.js`)
const readiness = require(`${__hooks}/lib/stock-delivery-readiness.js`)
const round = (value) => Math.round(value * 1000000) / 1000000
const lines = (record) => JSON.parse(record.getString('lines') || '[]')
const source = (app, quote) => require(`${__hooks}/lib/sales-procurement.js`).deliverySource(app, quote)
const operations = (app, quote) => app.findRecordsByFilter('inventory_operations', 'sales_quote = {:quote} && (kind = "OUT" || kind = "PREP") && (status = "done" || (status = "draft" && archived_at = ""))', 'created,id', 0, 0, { quote })
const coverage = (records) => {
  const totals = new Map()
  for (const record of records) for (const line of lines(record)) { const id = line.sales_line || line.source_line; totals.set(id, (totals.get(id) || 0) + line.quantity) }
  return totals
}
const scale = (line, quantity) => ({ ...line, quantity, allocations: (line.allocations || []).map((item) => ({ ...item, quantity: line.quantity ? round(item.quantity * quantity / line.quantity) : 0 })) })
module.exports = {
  checkPrepared(app, input, exclude = '') {
    if (!input.sales_quote || !['OUT', 'PREP'].includes(input.kind) || input.dropship) return
    const sales = source(app, input.sales_quote), coveredLines = coverage(operations(app, input.sales_quote).filter((record) => record.id !== exclude))
    for (const line of input.lines.filter((row) => row.product)) {
      const sale = sales.lines.find((item) => item.id === line.source_line)
      const covered = coveredLines.get(line.source_line) || 0
      if (!sale || line.quantity + covered > sale.getFloat('quantity') + 0.000001) throw new ApiError(409, 'Cette quantité est déjà livrée ou préparée sur un autre bon. Consultez les BL liés.')
    }
  },
  sync(app, user, quote, warehouse, parent = '') {
    const sales = source(app, quote), existing = operations(app, quote), destination = parent ? c.get(app, 'inventory_operations', parent).getString('destination') : sales.destination
    const reusable = existing.find((record) => record.getString('status') === 'draft' && record.getString('warehouse') === warehouse && (!parent || record.getString('destination') === destination) && record.getString('creation_key').startsWith('sales-delivery-') && !record.getString('creation_hash'))
    const coveredLines = coverage(existing.filter((record) => record.id !== reusable?.id)), account = sales.order.getString('analytic_child') || sales.order.getString('analytic_account')
    const items = sales.lines.flatMap((line) => {
      if (!line.getString('product')) return []
      const product = c.get(app, 'inventory_products', line.getString('product'))
      if (product.getString('stock_policy') === 'none') return []
      const covered = coveredLines.get(line.id) || 0
      const quantity = Math.max(0, round(line.getFloat('quantity') - covered)); if (!quantity) return []
      const unit = c.get(app, 'inventory_units', product.getString('base_unit')).getString('code')
      if (line.getString('unit') !== unit) throw new BadRequestError('Convertissez la commande dans les unités de base avant préparation du BL.')
      return [{ id: `line-${line.id}`, product: product.id, source_line: line.id, sales_line: line.id, origin_line: '', quantity, planned_quantity: quantity, unit, unit_cost: line.getFloat('unit_cost'), description: line.getString('description'), brand: product.getString('manufacturer'), reference: product.getString('sku'), purpose: 'stock', tracking: product.getString('tracking'), traces: [], from_location: '', to_location: '', expected: 0, counted: null, allocations: [{ analytic_account: account, quantity }] }]
    })
    if (!items.length) return existing.find((record) => record.getString('status') === 'draft') || null
    const places = app.findRecordsByFilter('inventory_locations', 'warehouse = {:warehouse} && active = true', 'code,id', 0, 0, { warehouse }), main = places.find((record) => record.getString('code') === 'STOCK') || (places.length === 1 ? places[0] : null)
    const old = reusable ? lines(reusable) : []
    for (const item of items) { const previous = old.find((line) => line.source_line === item.source_line); item.from_location = places.some((place) => place.id === previous?.from_location) ? previous.from_location : main?.id || ''; item.traces = previous?.traces || [] }
    if (reusable && c.hash(old) === c.hash(items)) return reusable
    const record = reusable || new Record(app.findCollectionByNameOrId('inventory_operations')), before = reusable?.publicExport() || null
    if (!reusable) {
      record.set('number', require(`${__hooks}/lib/stock-purchase-receipts.js`).number(app, warehouse, 'OUT')); record.set('actor', user.id)
      record.set('creation_key', `sales-delivery-${quote}-${$security.randomString(20)}`); record.set('creation_hash', '')
    }
    for (const [key, value] of Object.entries({ kind: 'OUT', status: 'draft', warehouse, sales_quote: quote, opportunity: sales.quote.getString('opportunity'), title: `Livraison · ${sales.quote.getString('quote_number')}`, destination: reusable?.getString('destination') || destination, document_date: reusable?.getString('document_date') || new Date().toISOString().slice(0, 10), lines: items, scope: [], inventory_mode: 'cycle' })) record.set(key, value)
    if (parent && !record.getString('delivery_parent')) record.set('delivery_parent', parent)
    app.save(record); c.audit(app, user, record, before, parent ? 'Reliquat de livraison préparé' : 'Bon de livraison préparé')
    return record
  },
  partial(record, quantities) {
    if (!readiness.delivery(record)) throw new BadRequestError('Quantités partielles réservées aux BL de commande client.')
    if (!Array.isArray(quantities) || quantities.length !== lines(record).filter((line) => line.product).length) throw new BadRequestError('Renseignez la quantité réellement livrée de chaque ligne.')
    const selected = new Map()
    for (const item of quantities) { c.exact(item, ['id', 'quantity', 'traces']); if (selected.has(item.id)) throw new BadRequestError('Ligne répétée.'); selected.set(item.id, { quantity: c.number(item.quantity, 0, 1000000), traces: item.traces === undefined ? undefined : require(`${__hooks}/lib/stock-traces.js`).normalize(item.traces) }) }
    const actual = lines(record).map((line) => {
      if (!line.product) return line
      const choice = selected.get(line.id), quantity = choice?.quantity
      if (quantity === undefined || quantity > line.quantity + 0.000001) throw new BadRequestError('La livraison ne peut pas dépasser les quantités prévues.')
      return { ...scale(line, quantity), traces: quantity === 0 ? [] : choice.traces ?? line.traces, planned_quantity: line.quantity }
    })
    if (!actual.some((line) => line.product && line.quantity > 0)) throw new BadRequestError('Aucune quantité à livrer. Conservez ce BL en brouillon.')
    record.set('lines', actual)
  },
  // Purchasing exposes confirmed-order candidates; Inventory never guesses by name.
  candidates(app, receipt) { return require(`${__hooks}/lib/purchasing-stock-source.js`).deliveryCandidates(app, receipt) },
  fromReceipt(app, user, receipt, selections = []) {
    if (!app.findAllRecords('settings_stock')[0].getBool('auto_prepare_deliveries')) return
    const candidates = module.exports.candidates(app, receipt), matches = (JSON.parse(receipt.getString('delivery_matches') || '[]') || []), quotes = new Set()
    for (const candidate of candidates) {
      const chosen = selections.find((item) => item.line_id === candidate.line_id && item.analytic_account === candidate.analytic_account) || matches.find((item) => item.line_id === candidate.line_id && item.analytic_account === candidate.analytic_account)
      const target = chosen ? candidate.options.find((item) => item.sales_line === chosen.sales_line && item.sales_quote === chosen.sales_quote) : candidate.options.length === 1 ? candidate.options[0] : null
      if (chosen && !target) throw new ApiError(409, 'Le rattachement de cette réception a changé. Actualisez les commandes proposées.')
      if (target) quotes.add(target.sales_quote)
    }
    for (const quote of quotes) module.exports.sync(app, user, quote, receipt.getString('warehouse'))
    return candidates.filter((candidate) => candidate.options.length !== 1 && !selections.some((item) => item.line_id === candidate.line_id && item.analytic_account === candidate.analytic_account) && !matches.some((item) => item.line_id === candidate.line_id && item.analytic_account === candidate.analytic_account))
  },
}

module.exports.needed = (app, quote) => {
  const sales = source(app, quote), done = coverage(operations(app, quote).filter((record) => record.getString('status') === 'done'))
  return sales.lines.some((line) => line.getString('product') && c.get(app, 'inventory_products', line.getString('product')).getString('stock_policy') !== 'none' && line.getFloat('quantity') - (done.get(line.id) || 0) > 0.000001)
}
