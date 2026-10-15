// Read-only operational identities; links to source documents require their module permission.
const c = require(`${__hooks}/lib/purchasing-common.js`)
module.exports = (app, user, record, details) => {
  const rights = c.policy.permissions(app, user), kind = record.getString('kind')
  const snapshot = JSON.parse(record.getString('document_snapshot') || 'null')
  const warehouse = snapshot?.['stock.warehouse'] ?? c.get(app, 'inventory_warehouses', record.getString('warehouse')).getString('name')
  const place = (side, fallback) => {
    const ids = [...new Set(JSON.parse(record.getString('lines') || '[]').map((line) => line[side]).filter(Boolean))]
    const names = ids.map((id) => c.get(app, 'inventory_locations', id).getString('name'))
    return [fallback, ...names.filter((name) => name !== fallback)].filter(Boolean).join(' / ')
  }
  const customers = [...new Set(details.affair_tags.map((tag) => tag.client).filter(Boolean))]
  const quote = record.getString('sales_quote') ? c.get(app, 'sales_quotes', record.getString('sales_quote')) : null
  if (!customers.length && quote?.getString('company')) customers.push(c.get(app, 'contacts_companies', quote.getString('company')).getString('name'))
  const customer = customers.join(' / ') || snapshot?.['stock.destination'] || record.getString('destination')
  const source_documents = []
  let from_name = place('from_location', warehouse), to_name = customer
  if (kind === 'IN') { from_name = details.supplier_name || record.getString('reason') || 'Entrée manuelle'; to_name = place('to_location', warehouse) }
  if (kind === 'OUT' && record.getBool('dropship')) from_name = details.supplier_name || 'Fournisseur'
  if (kind === 'OUT' && record.getBool('scrap')) to_name = 'Rebut'
  if (kind === 'OUT' && record.getBool('internal_use')) to_name = record.getString('destination') || 'Parc interne'
  if (kind === 'INT') to_name = place('to_location', record.getString('destination_warehouse') ? c.get(app, 'inventory_warehouses', record.getString('destination_warehouse')).getString('name') : warehouse)
  if (kind === 'INV') to_name = from_name
  if (kind === 'RET' && record.getString('origin')) {
    const origin = c.get(app, 'inventory_operations', record.getString('origin'))
    const original = module.exports(app, user, origin, require(`${__hooks}/lib/stock-operation-details.js`)(app, origin))
    if (origin.getString('kind') === 'IN') to_name = original.from_name
    else { from_name = original.to_name; to_name = place('to_location', warehouse) }
    source_documents.push({ number: origin.getString('number'), href: `/inventory/operations/${origin.id}` })
  } else {
    if (details.purchase_number) source_documents.push({ number: details.purchase_number, href: rights.includes('purchasing.read') ? `/purchasing/orders/${record.getString('purchase_order')}` : '' })
    if (quote && rights.includes('sales.read')) {
      const order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '-created,id', 1, 0, { id: quote.id })[0]
      source_documents.push({ number: order?.getString('order_number') || quote.getString('quote_number'), href: `/sales/quotes/${quote.id}` })
    }
  }
  return { from_name, to_name, source_documents }
}
