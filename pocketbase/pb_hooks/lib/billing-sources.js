const b = require(`${__hooks}/lib/billing-common.js`)
const source = (app, direction, id) => require(`${__hooks}/lib/${direction === 'customer' ? 'sales' : 'purchasing'}-billing-source.js`)(app, id)
module.exports = {
  source,
  coverage(app, direction, exclude = '', includeDraft = true) {
    const totals = new Map(), parents = new Map(b.activeDocuments(app, direction).filter((record) => record.id !== exclude && (includeDraft || record.getString('status') === 'validated')).map((record) => [record.id, record]))
    for (const record of app.findAllRecords(b.config(direction).lines)) {
      const parent = parents.get(record.getString(b.config(direction).parent)), id = record.getString('source_line'); if (!parent || !id || parent.getString('invoice_kind') === 'deposit') continue
      totals.set(id, (totals.get(id) || 0) + record.getFloat('quantity'))
    }
    const creditKind = `${direction}_credit`, credits = new Map(app.findRecordsByFilter(b.config(creditKind).collection, 'status = "validated"', '', 0, 0).map((record) => [record.id, record]))
    for (const record of app.findAllRecords(b.config(creditKind).lines)) { const credit = credits.get(record.getString(b.config(creditKind).parent)); if (!credit || !record.getString('source_line')) continue; const parent = b.get(app, b.config(direction).collection, credit.getString('source_invoice')); if (parent.getString('invoice_kind') !== 'deposit') { const id = record.getString('source_line'); totals.set(id, (totals.get(id) || 0) - record.getFloat('quantity')) } }
    return totals
  },
  operationCoverage(app, direction, exclude = '') {
    const totals = new Map(), parents = new Map(b.activeDocuments(app, direction).filter((record) => record.id !== exclude).map((record) => [record.id, record]))
    for (const line of app.findAllRecords(b.config(direction).lines)) { const parent = parents.get(line.getString(b.config(direction).parent)); if (!parent || parent.getString('invoice_kind') === 'deposit' || !line.getString('source_operation')) continue; const key = `${line.getString('source_operation')}/${line.getString('source_operation_line')}`; totals.set(key, (totals.get(key) || 0) + line.getFloat('quantity')) }
    const kind = `${direction}_credit`, creditParents = new Set(app.findRecordsByFilter(b.config(kind).collection, 'status = "validated"', '', 0, 0).map((record) => record.id))
    for (const line of app.findAllRecords(b.config(kind).lines)) if (creditParents.has(line.getString(b.config(kind).parent)) && line.getString('source_operation')) { const key = `${line.getString('source_operation')}/${line.getString('source_operation_line')}`; totals.set(key, (totals.get(key) || 0) - line.getFloat('quantity')) }
    return totals
  },
  operations(app, direction, order) {
    return app.findRecordsByFilter('inventory_operations', `${direction === 'customer' ? 'sales_quote' : 'purchase_order'} = {:id} && kind = {:kind} && status = "done"`, '', 0, 0, { id: order, kind: direction === 'customer' ? 'OUT' : 'IN' })
  },
  quantities(app, direction, order) {
    const totals = new Map()
    for (const operation of module.exports.operations(app, direction, order)) for (const line of b.json(operation, 'lines')) { const id = line.sales_line || line.source_line; totals.set(id, (totals.get(id) || 0) + line.quantity) }
    return totals
  },
  prepare(app, user, body) {
    b.exact(body, ['kind', 'source_type', 'source_ids', 'mode', 'deposit_percent']); const kind = body.kind, type = b.config(kind)
    if (type.credit || !['order', 'operation'].includes(body.source_type) || !['standard', 'deposit', 'balance'].includes(body.mode)) throw new BadRequestError('Préparation invalide.')
    if (!Array.isArray(body.source_ids) || !body.source_ids.length || body.source_ids.length > 30 || new Set(body.source_ids).size !== body.source_ids.length) throw new BadRequestError('Sélectionnez les sources sans doublon.')
    const rights = b.policy.permissions(app, user); if (!rights.includes(type.direction === 'customer' ? 'sales.read' : 'purchasing.read')) throw new ForbiddenError('Accès au module source nécessaire.')
    const operationIds = body.source_type === 'operation' ? body.source_ids : [], operations = operationIds.map((id) => b.get(app, 'inventory_operations', id))
    if (operations.length && (!rights.includes('inventory.read') || body.mode === 'deposit')) throw new ForbiddenError('Accès Stock nécessaire ou source d’acompte invalide.')
    for (const operation of operations) if (operation.getString('status') !== 'done' || operation.getString('kind') !== (type.direction === 'customer' ? 'OUT' : 'IN') || operation.getBool('scrap') || operation.getBool('internal_use')) throw new BadRequestError('Choisissez une livraison/réception réalisée de commande.')
    const orderIds = body.source_type === 'order' ? body.source_ids : [...new Set(operations.map((operation) => operation.getString(type.direction === 'customer' ? 'sales_quote' : 'purchase_order')))]
    const sources = orderIds.map((id) => source(app, type.direction, id)), first = sources[0]
    if (sources.some((item) => item.company !== first.company || item.currency !== first.currency)) throw new BadRequestError('Regroupez uniquement les pièces du même tiers et de la même devise.')
    if (first.currency !== 'EUR') throw new BadRequestError('La validation hors EUR attend le raccordement BCE.')
    const operationCovered = module.exports.operationCoverage(app, type.direction), covered = module.exports.coverage(app, type.direction), codes = b.json(b.settings(app), 'tax_codes'), selected = new Map()
    for (const operation of operations) for (const line of b.json(operation, 'lines')) { const id = line.sales_line || line.source_line; selected.set(id, (selected.get(id) || 0) + line.quantity) }
    const lines = sources.flatMap((item) => item.lines.flatMap((line) => {
      if (line.kind !== 'item') return body.mode === 'deposit' || operations.length ? [] : [{ ...line, key: `line-${line.id}`, source_type: '', source_line: '', source_order: '', source_operation: '', source_operation_line: '', credit_source_line: '', discount: 0, tax_code: '', quantity: 0, unit_price: 0 }]
      let quantity = Math.max(0, line.quantity - (covered.get(line.id) || 0)); if (operations.length) quantity = Math.min(quantity, selected.get(line.id) || 0)
      if (body.mode === 'deposit') quantity = line.quantity
      if (quantity <= 0.000001) return []
      if (type.direction === 'customer' && body.mode !== 'deposit') line = { ...line, unit_price: require(`${__hooks}/lib/billing-order-balance.js`).price(app, item, line) }
      const tax = codes.find((code) => Math.abs(code.rate - line.tax_rate) < 0.000001); if (!tax) throw new BadRequestError('Configurez un code TVA correspondant à la source.')
      if (operations.length) {
        let remaining = quantity
        return operations.flatMap((operation) => b.json(operation, 'lines').filter((row) => (row.sales_line || row.source_line) === line.id).flatMap((row) => { const available = Math.max(0, row.quantity - (operationCovered.get(`${operation.id}/${row.id}`) || 0)), portion = Math.min(remaining, available); remaining -= portion; if (portion <= 0.000001) return []; return [{ ...line, key: `line-${line.id}-${operation.id}-${row.id}`, quantity: portion, discount: 0, tax_code: tax.code, source_type: type.direction, source_line: line.id, source_order: item.id, source_operation: operation.id, source_operation_line: row.id, credit_source_line: '' }] }))
      }
      return [{ ...line, key: `line-${line.id}`, description: line.description, quantity, discount: 0, tax_code: tax.code, source_type: type.direction, source_line: line.id, source_order: item.id, source_operation: operations.length === 1 ? operations[0].id : '', source_operation_line: '', credit_source_line: '' }]
    }))
    if (!lines.some((line) => line.kind === 'item')) throw new BadRequestError('Aucune quantité restante à facturer.')
    return { customer_order_number: type.direction === 'customer' ? [...new Set(sources.map((source) => (source.customer_reference || 'Attente Commande').replace(/attente commande/gi, 'Attente Commande')))].join(' · ') : '', company: first.company, invoice_kind: body.mode === 'deposit' ? 'deposit' : 'standard', deposit_percent: body.mode === 'deposit' ? b.number(body.deposit_percent, 0.0001, 100) : 0, title: `${type.label} · ${sources.map((item) => item.number).join(', ')}`, source_orders: orderIds, source_operations: operationIds, lines, deduction_ids: body.mode === 'deposit' ? [] : b.activeDocuments(app, type.direction).filter((record) => record.getString('status') === 'validated' && record.getString('invoice_kind') === 'deposit' && b.json(record, 'source_orders').every((id) => orderIds.includes(id))).map((record) => record.id) }
  },
}
