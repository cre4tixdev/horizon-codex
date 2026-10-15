// Inventory-owned lifecycle. Purchasing supplies immutable source line data.
// Call inside the transaction that changes the order or validates a receipt.
const rounded = (value) => Math.round(value * 1000000) / 1000000
const rows = (record) => JSON.parse(record.getString('lines') || '[]')
const number = (app, warehouse, kind) => {
  const record = app.findRecordById('inventory_warehouses', warehouse)
  if (!record.getBool('active')) throw new BadRequestError('Entrepôt inactif.')
  const counters = JSON.parse(record.getString('counters') || '{}'), next = (counters[kind] || 0) + 1
  if (!Number.isSafeInteger(next)) throw new BadRequestError('Séquence épuisée.')
  counters[kind] = next; record.set('counters', counters); app.save(record)
  return `${record.getString('code')}/${kind}/${String(next).padStart(5, '0')}`
}
module.exports = {
  number,
  sync(app, source, actor, audit) {
    const operations = app.findRecordsByFilter('inventory_operations', 'purchase_order = {:id}', 'created,id', 0, 0, { id: source.id })
    const pending = operations.filter((record) => record.getString('kind') === 'IN' && record.getString('status') === 'draft')
    const cancel = (record) => { const before = record.publicExport(); record.set('status', 'cancelled'); app.save(record); audit(record, before, 'Réception en attente annulée') }
    if (!['validated', 'sent', 'acknowledged', 'partially_received'].includes(source.status) || source.archived) {
      // Archiving a live order does not cancel its expected arrival.
      if (!source.archived || !['validated', 'sent', 'acknowledged', 'partially_received'].includes(source.status)) pending.forEach(cancel)
      return
    }
    const automatic = (record) => record.getString('creation_key').startsWith('purchase-receipt-') || !rows(record).some((line) => line.product)
    const reusable = pending.find(automatic)
    const manual = pending.filter((record) => !automatic(record) && !record.getString('archived_at'))
    const realized = operations.filter((record) => record.getString('status') === 'done' && ['IN', 'OUT'].includes(record.getString('kind'))).flatMap(rows)
    const items = source.lines.flatMap((line) => {
      if (!line.product) return []
      const product = app.findRecordById('inventory_products', line.product)
      if (product.getString('stock_policy') === 'none') return []
      const received = realized.filter((item) => item.source_line === line.source_line).reduce((sum, item) => sum + item.quantity, 0)
      const scheduled = manual.flatMap(rows).filter((item) => item.source_line === line.source_line).reduce((sum, item) => sum + item.quantity, 0)
      const quantity = Math.max(0, rounded(line.quantity - received - scheduled))
      if (!quantity) return []
      const total = line.allocations.reduce((sum, item) => sum + item.quantity, 0)
      return [{ ...line, id: `line-${line.source_line}`, quantity, sales_line: '', origin_line: '', from_location: '', to_location: '', expected: 0, counted: null, allocations: line.allocations.map((item) => ({ analytic_account: item.analytic_account, quantity: total ? rounded(quantity * item.quantity / total) : 0 })) }]
    })
    if (!items.length) { pending.filter(automatic).forEach(cancel); return }
    const warehouse = reusable?.getString('warehouse') || source.warehouse
    const places = app.findRecordsByFilter('inventory_locations', 'warehouse = {:id} && active = true', 'code,id', 0, 0, { id: warehouse })
    const destination = places.find((place) => place.getString('code') === 'STOCK') || (places.length === 1 ? places[0] : null)
    const previous = reusable ? rows(reusable) : []
    for (const line of items) {
      const oldPlace = previous.find((item) => item.source_line === line.source_line)?.to_location
      line.to_location = places.some((place) => place.id === oldPlace) ? oldPlace : destination?.id || ''
    }
    const record = reusable || new Record(app.findCollectionByNameOrId('inventory_operations')), before = reusable ? record.publicExport() : null
    if (!reusable) { record.set('creation_key', `purchase-receipt-${source.id}-${$security.randomString(20)}`); record.set('creation_hash', ''); record.set('actor', actor) }
    for (const [key, value] of Object.entries({ kind: 'IN', status: 'draft', inventory_mode: 'cycle', warehouse, purchase_order: source.id, title: `Réception · ${source.number}`, document_date: reusable?.getString('document_date') || new Date().toISOString().slice(0, 10), planned_date: source.needed_date, lines: items, scope: [] })) record.set(key, value)
    pending.filter((item) => item.id !== record.id && automatic(item)).forEach(cancel)
    if (before && JSON.stringify(previous) === JSON.stringify(items) && before.warehouse === warehouse && before.title === `Réception · ${source.number}` && before.planned_date === source.needed_date) return
    app.save(record); audit(record, before, 'Réception fournisseur en attente')
  },
}
