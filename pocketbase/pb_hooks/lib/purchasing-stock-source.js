// Purchasing owns its documents. Inventory calls this boundary to receive a source
// and to update the aggregate reception status after a committed stock operation.
const c = require(`${__hooks}/lib/purchasing-common.js`)
module.exports = {
  deliveryCandidates(app, receipt) {
    const result = [], orderCache = new Map(), accounts = new Map(), orderLists = new Map(), quotes = new Map()
    for (const line of JSON.parse(receipt.getString('lines') || '[]').filter((item) => item.product && item.quantity > 0 && (item.purpose || 'stock') === 'stock')) {
      const purchased = line.source_line && receipt.getString('purchase_order') ? c.get(app, 'purchasing_order_lines', line.source_line) : null
      const requested = purchased?.getString('request_line') ? c.get(app, 'purchasing_request_lines', purchased.getString('request_line')) : null
      const direct = requested?.getString('source_line') ? c.get(app, 'sales_order_lines', requested.getString('source_line')) : null
      for (const allocation of line.allocations || []) {
        if (!accounts.has(allocation.analytic_account)) accounts.set(allocation.analytic_account, c.get(app, 'accounting_analytic_accounts', allocation.analytic_account))
        const analytic = accounts.get(allocation.analytic_account)
        if (!analytic.getString('opportunity') || !(allocation.quantity > 0)) continue
        const scope = direct ? direct.getString('order') : analytic.getString('opportunity'), scopeKey = `${direct ? 'order' : 'affair'}/${scope}`
        if (!orderLists.has(scopeKey)) orderLists.set(scopeKey, direct ? [c.get(app, 'sales_orders', scope)] : app.findRecordsByFilter('sales_orders', 'opportunity = {:id} && status = "confirmed"', 'created,id', 100, 0, { id: scope }))
        const orders = orderLists.get(scopeKey)
        const options = orders.flatMap((order) => {
          if (order.getString('status') !== 'confirmed' || order.getString('opportunity') !== analytic.getString('opportunity')) return []
          if (!quotes.has(order.getString('quote'))) quotes.set(order.getString('quote'), c.get(app, 'sales_quotes', order.getString('quote')))
          const quote = quotes.get(order.getString('quote'))
          if (quote.getString('status') !== 'accepted' || quote.getString('archived_at') || analytic.getString('source_quote') && analytic.getString('source_quote') !== quote.id) return []
          if (!orderCache.has(order.id)) orderCache.set(order.id, app.findRecordsByFilter('sales_order_lines', 'order = {:id} && kind = "item"', 'position', 0, 0, { id: order.id }))
          return orderCache.get(order.id).filter((sale) => sale.getString('product') === line.product && sale.getString('unit') === line.unit && (!direct || direct.id === sale.id)).map((sale) => ({ sales_quote: quote.id, sales_line: sale.id, label: `${quote.getString('quote_number')} · ${sale.getString('description')}` }))
        })
        result.push({ line_id: line.id, analytic_account: analytic.id, label: `${line.description} · ${analytic.getString('code')}`, options })
      }
    }
    return result
  },
  receiptIdentity(app, id) {
    const record = c.get(app, 'purchasing_orders', id), snapshot = JSON.parse(record.getString('document_snapshot') || 'null')
    const fields = snapshot?.supplier_fields || require(`${__hooks}/lib/contacts-document-context.js`)(app, c.get(app, 'contacts_companies', record.getString('supplier'))).fields
    return { purchase_number: record.getString('order_number'), supplier_name: fields['company.name'] || snapshot?.supplier_name || '', supplier_address: fields['company.address'] || '' }
  },
  receiptData(app, record) {
    let warehouse = record.getString('delivery_warehouse')
    if (!warehouse && ['validated', 'sent', 'acknowledged', 'partially_received'].includes(record.getString('status'))) {
      const places = app.findRecordsByFilter('inventory_warehouses', 'active = true', 'name,id', 0, 0)
      warehouse = places.find((item) => item.getString('code') === 'MEU')?.id || (places.length === 1 ? places[0].id : '')
      if (!warehouse) throw new BadRequestError('Renseignez un entrepôt de livraison pour reprendre les réceptions de cette commande.')
    }
    return { id: record.id, number: record.getString('order_number'), status: record.getString('status'), archived: Boolean(record.getString('archived_at')), warehouse, needed_date: record.getString('needed_date').slice(0, 10), lines: c.rows(app, 'order', record.id).map((line) => ({ source_line: line.id, purpose: line.getString('purpose') || 'stock', tracking: line.getString('product') ? c.get(app, 'inventory_products', line.getString('product')).getString('tracking') : 'none', traces: [], product: line.getString('product'), description: line.getString('description'), brand: line.getString('brand'), reference: line.getString('reference'), quantity: line.getFloat('quantity'), unit: line.getString('unit'), unit_cost: line.getFloat('unit_price') * (1 - line.getFloat('discount') / 100), allocations: c.allocations(app, 'order', line) })) }
  },
  source(app, user, id) {
    require(`${__hooks}/lib/stock.js`).guard(app, user); const record = c.get(app, 'purchasing_orders', id)
    if (!['validated', 'sent', 'acknowledged', 'partially_received', 'received'].includes(record.getString('status')) || record.getString('archived_at')) throw new BadRequestError('Choisissez un bon de commande fournisseur validé et actif.')
    return { record, lines: c.rows(app, 'order', id) }
  },
  quoteLinks(app, user, id) {
    if (!c.allowed(app, user)) return []
    return [...new Set(c.rows(app, 'order', id).filter((line) => line.getString('request_line')).map((line) => c.get(app, 'purchasing_request_lines', line.getString('request_line'))).filter((line) => line.getString('source_line')).map((line) => c.get(app, 'sales_orders', c.get(app, 'sales_order_lines', line.getString('source_line')).getString('order')).getString('quote')))]
  },
  receivedForSaleLine(app, id, excludeRequest = '') {
    const requests = app.findRecordsByFilter('purchasing_request_lines', 'source_line = {:id} && request.status != "cancelled" && request.id != {:exclude}', '', 0, 0, { id, exclude: excludeRequest })
    return requests.reduce((sum, request) => sum + app.findRecordsByFilter('purchasing_order_lines', 'request_line = {:id} && order.status != "cancelled"', '', 0, 0, { id: request.id }).reduce((total, line) => total + require(`${__hooks}/lib/stock-operations.js`).consumed(app, 'purchase_order', line.getString('order'), ['IN', 'OUT'], line.id), 0), 0)
  },
  refresh(app, user, id) {
    const { record, lines } = module.exports.source(app, user, id), operations = require(`${__hooks}/lib/stock-operations.js`), quantities = lines.map((line) => operations.consumed(app, 'purchase_order', id, ['IN', 'OUT'], line.id))
    const next = lines.length && lines.every((line, index) => quantities[index] + 0.000001 >= line.getFloat('quantity')) ? 'received' : quantities.some((value) => value > 0) ? 'partially_received' : record.getString('status')
    if (next !== record.getString('status')) { const before = record.publicExport(); record.set('status', next); app.save(record); c.audit(app, user, record, before, 'Réception fournisseur enregistrée') }
    operations.syncPurchase(app, user, record)
  },
}
