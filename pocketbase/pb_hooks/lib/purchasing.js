const c = require(`${__hooks}/lib/purchasing-common.js`)
const table = (kind) => kind === 'request' ? 'purchasing_requests' : 'purchasing_orders'
const reserved = (app, source) => app.findRecordsByFilter('inventory_reservations', 'order_line = {:id} && active = true', '', 0, 0, { id: source }).reduce((sum, item) => sum + item.getFloat('quantity'), 0)
const checkVersion = (record, updated) => { if (record.getString('updated') !== updated) throw new ApiError(409, 'La pièce a été modifiée. Rechargez-la.') }
const rootFields = ['title', 'opportunity', 'source_order', 'source_quote', 'supplier', 'document_date', 'needed_date', 'currency', 'exchange_rate', 'tax_rate', 'notes', 'owner', 'delivery_warehouse', 'lines']
const checkAllocationCoverage = (allocations, quantity, complete) => {
  const total = allocations.reduce((sum, item) => sum + item.quantity, 0)
  if (total - quantity > 0.000001 || complete && Math.abs(total - quantity) > 0.000001 || new Set(allocations.map((item) => item.analytic_account)).size !== allocations.length) throw new BadRequestError('La ventilation doit couvrir exactement la quantité de la ligne, sans compte répété.')
}
const validateLines = (app, kind, record) => {
  for (const line of c.rows(app, kind, record.id)) {
    if (['internal', 'asset'].includes(line.getString('purpose')) && (!line.getString('product') || c.get(app, 'inventory_products', line.getString('product')).getString('stock_policy') === 'none' || !Number.isInteger(line.getFloat('quantity')))) throw new BadRequestError('Le parc et les immobilisations exigent un produit stockable et une quantité entière.');
    if (!line.getString('description').trim()) throw new BadRequestError(`Renseignez la description de la ligne ${line.getInt('position')} avant de valider.`)
    checkAllocationCoverage(c.allocations(app, kind, line), line.getFloat('quantity'), (line.getString('purpose') || 'stock') === 'stock' || c.allocations(app, kind, line).length > 0)
  }
}
const normalize = (app, user, input, kind) => {
  c.exact(input, rootFields)
  const result = { title: c.text(input.title, 200, true), opportunity: input.opportunity || '', source_order: input.source_order || '', source_quote: kind === 'request' ? input.source_quote || '' : '', supplier: input.supplier || '', document_date: c.date(input.document_date, true), needed_date: c.date(input.needed_date || ''), currency: c.text(input.currency, 3, true), exchange_rate: c.number(input.exchange_rate ?? (input.currency === 'EUR' ? 1 : 0), 0, 1000000), tax_rate: c.number(input.tax_rate ?? app.findAllRecords('settings_purchasing')[0].getFloat('default_tax_rate'), 0, 100), notes: c.text(input.notes || '', 10000), lines: [] }
  if (!app.findRecordsByFilter('accounting_currencies', 'code = {:code} && active = true', '', 1, 0, { code: result.currency }).length) throw new BadRequestError('Devise inactive.')
  if (result.opportunity) { const opp = c.opportunity(app, user, result.opportunity); if (opp.getString('currency') !== result.currency) throw new BadRequestError('La devise est différente de celle de l’opportunité.') }
  if (kind === 'order') { c.supplier(app, result.supplier); result.owner = input.owner || user.id; result.delivery_warehouse = input.delivery_warehouse || require(`${__hooks}/lib/stock.js`).defaultDeliveryWarehouse(app, user); const buyer = c.get(app, 'core_users', result.owner); if (!buyer.getBool('active') || !c.allowed(app, buyer, 'write')) throw new BadRequestError('Choisissez un acheteur actif habilité aux achats.'); if (result.delivery_warehouse) require(`${__hooks}/lib/stock.js`).deliveryWarehouse(app, user, result.delivery_warehouse, true) }
  let sales
  if (result.source_order) { const order = c.get(app, 'sales_orders', result.source_order); sales = require(`${__hooks}/lib/sales-procurement.js`)(app, user, order.getString('quote')); if (sales.order.id !== order.id || order.getString('currency') !== result.currency) throw new BadRequestError('La commande source n’est plus active.') }
  if (kind === 'request') {
    if (sales) { if (result.source_quote && result.source_quote !== sales.quote.id) throw new BadRequestError('Le devis doit correspondre à la commande source.'); result.source_quote = sales.quote.id }
    if (result.source_quote) { const quote = require(`${__hooks}/lib/sales-procurement.js`).purchaseSource(app, user, result.source_quote); if (quote.opportunity !== result.opportunity || quote.currency !== result.currency) throw new BadRequestError('Le devis source doit appartenir à la même affaire et utiliser la même devise.') }
  }
  if (!Array.isArray(input.lines) || input.lines.length > 200) throw new BadRequestError('200 lignes maximum.')
  for (const item of input.lines) {
    c.exact(item, ['id', 'product', 'description', 'reference', 'brand', 'quantity', 'unit', 'unit_price', 'discount', 'supplier', 'source_line', 'request_line', 'allocations', 'purpose'])
    const purpose = item.purpose || 'stock'; if (!['stock', 'consumption', 'internal', 'asset'].includes(purpose)) throw new BadRequestError('Destination d’achat invalide.');
    const line = { purpose, product: item.product || '', description: c.text(item.description ?? '', 2000), reference: c.text(item.reference || '', 160), brand: c.text(item.brand || '', 160), quantity: c.number(item.quantity, 0.000001, 1000000), unit: c.text(item.unit, 40, true), unit_price: c.number(item.unit_price), discount: c.number(item.discount || 0, 0, 100), supplier: item.supplier || result.supplier, source_line: item.source_line || '', request_line: item.request_line || '', snapshot: null, allocations: [] }
    if (!app.findRecordsByFilter('inventory_units', 'code = {:code} && active = true', '', 1, 0, { code: line.unit }).length) throw new BadRequestError('Choisissez une unité active.');
    if (line.supplier) c.supplier(app, line.supplier)
    if (line.product) { const product = require(`${__hooks}/lib/catalog-procurement.js`)(app, user, line.product, line.supplier, result.currency); if (product.unit !== line.unit) throw new BadRequestError('Utilisez l’unité de base du produit.'); line.snapshot = product.snapshot }
    if ((sales || line.source_line) && line.purpose !== 'stock') throw new BadRequestError('Les besoins client conservent leur destination commerciale.');
    if (sales && !line.source_line) throw new BadRequestError('Chaque ligne doit conserver sa source dans la commande client.');
    if (line.source_line && (!sales || !sales.lines.some((source) => source.id === line.source_line && source.getString('product') === line.product))) throw new BadRequestError('Ligne source invalide.')
    if (kind === 'order' && line.request_line) { const requestLine = c.get(app, 'purchasing_request_lines', line.request_line), request = c.get(app, 'purchasing_requests', requestLine.getString('request')); if (!['validated', 'partially_ordered', 'ordered'].includes(request.getString('status')) || request.getString('currency') !== result.currency || requestLine.getString('product') !== line.product) throw new BadRequestError('Demande validée de même devise requise.') }
    const fixedDefault = line.purpose !== 'stock' ? require(`${__hooks}/lib/analytic-fixed.js`).defaultFor(app, line.purpose) : ''
    const allocations = item.allocations?.length ? item.allocations : fixedDefault ? [{ fixed_account: fixedDefault, quantity: line.quantity }] : result.opportunity ? [{ opportunity: result.opportunity, quantity: line.quantity }] : []
    if (allocations.length > 50) throw new BadRequestError('Rattachez chaque ligne à au moins une opportunité.')
    for (const allocation of allocations) { c.exact(allocation, ['opportunity', 'order', 'quantity', 'fixed_account']); if (allocation.fixed_account) { if (allocation.opportunity || allocation.order || allocations.length !== 1 || sales || line.source_line) throw new BadRequestError('Une ligne Stock / Interne utilise un seul compte fixe, sans affaire ni commande client.'); const fixed = require(`${__hooks}/lib/analytic-fixed.js`).resolve(app, allocation.fixed_account); line.purpose = fixed.purpose; line.allocations.push({ analytic_account: fixed.id, quantity: c.number(allocation.quantity, 0.000001, line.quantity), percentage: allocation.quantity / line.quantity * 100 }); continue }; const opp = c.opportunity(app, user, allocation.opportunity); if (opp.getString('currency') !== result.currency) throw new BadRequestError('Ventilation dans une affaire de devise différente.'); let account = opp.getString('analytic_account')
      if (allocation.order) {
        if (!c.policy.permissions(app, user).includes('sales.read')) throw new ForbiddenError('Accès aux commandes nécessaire pour cette ventilation.')
        const command = c.get(app, 'sales_orders', allocation.order)
        if (command.getString('status') !== 'confirmed' || command.getString('opportunity') !== opp.id || !command.getString('analytic_child')) throw new BadRequestError('Choisissez une commande confirmée de cette affaire.')
        account = command.getString('analytic_child')
      } else if (sales && sales.order.getString('opportunity') === opp.id) account = sales.order.getString('analytic_child') || account
      line.allocations.push({ analytic_account: account, quantity: c.number(allocation.quantity, 0.000001, line.quantity), percentage: allocation.quantity / line.quantity * 100 }) }
    if (kind === 'order' && line.request_line && line.purpose !== (c.get(app, 'purchasing_request_lines', line.request_line).getString('purpose') || 'stock')) throw new BadRequestError('Conservez la destination de la demande source.');
    if (kind === 'order' && line.request_line) { const sourceAllocations = c.allocations(app, 'request', c.get(app, 'purchasing_request_lines', line.request_line)).filter((allocation) => allocation.fixed_account); if (sourceAllocations.length && (line.allocations.length !== 1 || line.allocations[0].analytic_account !== sourceAllocations[0].analytic_account)) throw new BadRequestError('Conservez le compte fixe de la demande source.'); }
    checkAllocationCoverage(line.allocations, line.quantity, false)
    if (sales && line.allocations.some((item) => item.analytic_account !== (sales.order.getString('analytic_child') || sales.order.getString('analytic_account')))) throw new BadRequestError('La ligne source conserve son compte analytique.')
    line.line_total = c.price(line.quantity, line.unit_price, line.discount); result.lines.push(line)
  }
  return result
}
const persistLines = (app, kind, record, lines) => {
  for (const previous of c.rows(app, kind, record.id)) { for (const allocation of app.findRecordsByFilter(`purchasing_${kind}_line_allocations`, `${kind}_line = {:id}`, '', 0, 0, { id: previous.id })) app.delete(allocation); app.delete(previous) }
  const taxed = require(`${__hooks}/lib/tax.js`).quote(lines.map((line) => ({ ...line, kind: 'item', is_option: false })), record.getFloat('tax_rate'))
  for (const [index, item] of taxed.lines.entries()) { const line = new Record(app.findCollectionByNameOrId(`purchasing_${kind}_lines`)); for (const key of ['purpose', 'product', 'description', 'reference', 'brand', 'quantity', 'unit', 'unit_price', 'discount', 'line_total', 'snapshot']) line.set(key, item[key]); line.set(kind, record.id); line.set('position', index + 1); if (kind === 'request') { line.set('suggested_supplier', item.supplier); line.set('source_line', item.source_line); line.set('needed_date', record.getString('needed_date')) } else { line.set('request_line', item.request_line); line.set('tax_rate', item.tax_rate); line.set('tax_amount', item.tax_amount) }; app.save(line)
    for (const itemAllocation of item.allocations) { const allocation = new Record(app.findCollectionByNameOrId(`purchasing_${kind}_line_allocations`)); allocation.set(`${kind}_line`, line.id); for (const key of ['analytic_account', 'quantity', 'percentage']) allocation.set(key, itemAllocation[key]); app.save(allocation) }
  }
  if (kind === 'order') { record.set('subtotal', lines.reduce((sum, line) => sum + Math.round(line.line_total * 100), 0) / 100); record.set('tax', taxed.tax); record.set('total', record.getFloat('subtotal') + taxed.tax); app.save(record) }
}
const needsFor = (app, user, quoteId, preview = false) => {
  c.guard(app, user)
  const source = require(`${__hooks}/lib/sales-procurement.js`)
  const { quote, order, lines } = preview ? source.confirmationPreview(app, user, quoteId) : source(app, user, quoteId)
  return { source_quote: quote.id, source_quote_number: quote.getString('quote_number'), source_order: order?.id || '', opportunity: quote.getString('opportunity'), title: `Achats · ${quote.getString('quote_number')} · ${quote.getString('title')}`, currency: quote.getString('currency'), lines: lines.map((source) => { let product = null; if (source.getString('product')) product = require(`${__hooks}/lib/catalog-procurement.js`)(app, user, source.getString('product'), '', quote.getString('currency')); const pending = c.requested(app, source.id), received = require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, source.id), stock = reserved(app, source.id), delivered = require(`${__hooks}/lib/stock-operations.js`).consumed(app, 'sales_quote', quote.id, ['OUT', 'PREP'], source.id); return { source_line: source.id, product: source.getString('product'), description: source.getString('description'), reference: product?.reference || '', brand: product?.brand || '', quantity: Math.max(0, source.getFloat('quantity') - pending - Math.max(0, stock + delivered - received)), sold_quantity: source.getFloat('quantity'), reserved: stock, prepared: pending, unit: source.getString('unit'), unit_price: product && product.currency === quote.getString('currency') ? product.unit_price : source.getFloat('unit_cost'), supplier: product?.currency === quote.getString('currency') ? product.supplier : '', price_currency: product?.currency || quote.getString('currency'), discount: 0, allocations: [] } }) }
}
const writeDraft = (app, user, kind, record, input, creationKey, hash, before) => {
      for (const key of ['title', 'opportunity', 'source_order', 'document_date', 'needed_date', 'currency', 'exchange_rate', 'notes']) record.set(key, input[key]); if (kind === 'order') { record.set('supplier', input.supplier); record.set('tax_rate', input.tax_rate); record.set('owner', input.owner); record.set('delivery_warehouse', input.delivery_warehouse) }
      if (!before) { record.set(kind + '_number', require(`${__hooks}/lib/numbering-service.js`)(app, table(kind))); record.set('created_by', user.id); record.set('creation_key', creationKey); record.set('creation_hash', hash); record.set('status', 'draft') }
      if (kind === 'request') record.set('source_quote', input.source_quote); record.set('source_module', input.source_order || input.source_quote ? 'sales' : 'manual'); record.set('source_record_id', input.source_order || input.source_quote); app.save(record); persistLines(app, kind, record, input.lines); c.audit(app, user, record, before, before ? 'Pièce d’achat modifiée' : 'Pièce d’achat créée')
}
const refreshRequests = (app, order) => {
  for (const id of new Set(c.rows(app, 'order', order.id).filter((line) => line.getString('request_line')).map((line) => c.get(app, 'purchasing_request_lines', line.getString('request_line')).getString('request')))) {
    const request = c.get(app, 'purchasing_requests', id), lines = c.rows(app, 'request', id), quantities = lines.map((line) => app.findRecordsByFilter('purchasing_order_lines', 'request_line = {:id} && (order.status = "sent" || order.status = "acknowledged" || order.status = "partially_received" || order.status = "received" || order.status = "closed")', '', 0, 0, { id: line.id }).reduce((total, item) => total + item.getFloat('quantity'), 0)); if (['draft', 'cancelled', 'completed'].includes(request.getString('status'))) continue; const status = lines.length && lines.every((line, index) => quantities[index] + 0.000001 >= line.getFloat('quantity')) ? 'ordered' : quantities.some((quantity) => quantity > 0) ? 'partially_ordered' : 'validated'; if (status !== request.getString('status')) { request.set('status', status); app.save(request) }
  }
}
const prepareOrders = (app, user, selections, creationKey) => {
  const hash = c.hash(selections), groups = new Map()
      const selected = new Set()
      for (const choice of selections) { c.exact(choice, ['id', 'quantity', 'supplier']); if (selected.has(choice.id)) throw new BadRequestError('Ligne répétée.'); selected.add(choice.id); const line = c.get(app, 'purchasing_request_lines', choice.id), request = c.get(app, 'purchasing_requests', line.getString('request')); if (!['validated', 'partially_ordered', 'ordered'].includes(request.getString('status')) || request.getString('archived_at')) throw new BadRequestError('Choisissez une demande validée active.'); c.supplier(app, choice.supplier); const quantity = c.number(choice.quantity, 0.000001, 1000000); if (quantity + c.orderQuantity(app, line.id) > line.getFloat('quantity') + 0.000001) throw new ApiError(409, 'Cette quantité est déjà préparée ou commandée.'); const key = choice.supplier + '-' + request.getString('currency'); if (!groups.has(key)) groups.set(key, { supplier: choice.supplier, currency: request.getString('currency'), needed_date: request.getString('needed_date'), lines: [] }); if (request.getString('needed_date') && (!groups.get(key).needed_date || request.getString('needed_date') < groups.get(key).needed_date)) groups.get(key).needed_date = request.getString('needed_date'); groups.get(key).lines.push({ ...line.publicExport(), quantity, request_line: line.id, supplier: choice.supplier, allocations: c.allocations(app, 'request', line).map((item) => ({ ...item, quantity: item.quantity * quantity / line.getFloat('quantity') })), line_total: c.price(quantity, line.getFloat('unit_price'), line.getFloat('discount')) }) }
      const result = []; let index = 0
      for (const group of groups.values()) { const order = new Record(app.findCollectionByNameOrId('purchasing_orders')); order.set('owner', user.id); order.set('delivery_warehouse', require(`${__hooks}/lib/stock.js`).defaultDeliveryWarehouse(app, user)); for (const [key, value] of Object.entries({ order_number: require(`${__hooks}/lib/numbering-service.js`)(app, 'purchasing_orders'), title: 'Commande fournisseur', status: 'draft', supplier: group.supplier, currency: group.currency, exchange_rate: group.currency === 'EUR' ? 1 : 0, document_date: new Date().toISOString().slice(0, 10), needed_date: group.needed_date || '', created_by: user.id, creation_key: `${creationKey}-group-${++index}`, creation_hash: hash, tax_rate: app.findAllRecords('settings_purchasing')[0].getFloat('default_tax_rate') })) order.set(key, value); const requests = [...new Set(group.lines.map((line) => c.get(app, 'purchasing_request_lines', line.request_line).getString('request')))]; if (requests.length === 1) order.set('request', requests[0]); app.save(order); persistLines(app, 'order', order, group.lines); c.audit(app, user, order, null, 'Commande fournisseur préparée depuis les demandes'); result.push(c.dto(app, user, 'order', order)) }
  return result
}
module.exports = {
  allowed: c.allowed,
  referencesQuote(app, id) { return app.findRecordsByFilter('purchasing_requests', 'source_quote = {:id}', '', 1, 0, { id }).length > 0 },
  refreshRequests,
  tracking(event) { c.guard(event.app, event.auth); const { lines } = require(`${__hooks}/lib/sales-procurement.js`)(event.app, event.auth, event.request.pathValue('id')); return event.json(200, Object.fromEntries(lines.map((line) => [line.getString('source_line'), module.exports.lineTracking(event.app, event.auth, line)]))) },
  choices(event) { c.guard(event.app, event.auth); const app = event.app, rights = c.policy.permissions(app, event.auth); return event.json(200, { fixed_accounts: require(`${__hooks}/lib/analytic-fixed.js`).choices(app), commands: rights.includes('sales.read') && rights.includes('crm.read') ? app.findRecordsByFilter('sales_orders', 'status = "confirmed"', '-created,id', 0, 0).map((order) => ({ id: order.id, opportunity: order.getString('opportunity'), code: c.get(app, 'sales_quotes', order.getString('quote')).getString('quote_number') })) : [], suppliers: app.findRecordsByFilter('contacts_companies', 'active = true && contacts_company_roles_via_company.role ?= "supplier" && contacts_company_roles_via_company.active ?= true', 'name,id', 500, 0).map((item) => ({ id: item.id, name: item.getString('name'), vat_number: require(`${__hooks}/lib/contacts-document-context.js`).supplierIdentity(item).vat_number || '' })), buyers: app.findRecordsByFilter('core_users', 'active = true', 'name,id', 0, 0).filter((user) => c.allowed(app, user, 'write')).map((user) => ({ id: user.id, name: user.getString('name') })), warehouses: require(`${__hooks}/lib/stock.js`).deliveryChoices(app, event.auth), default_owner: event.auth.id, default_warehouse: require(`${__hooks}/lib/stock.js`).defaultDeliveryWarehouse(app, event.auth), products: rights.includes('inventory.read') ? app.findRecordsByFilter('inventory_products', 'active = true && purchase_enabled = true', 'name,id', 500, 0).map((item) => ({ id: item.id, name: `${item.getString('manufacturer')} · ${item.getString('sku')} · ${item.getString('name')}` })) : [], opportunities: rights.includes('crm.read') ? app.findRecordsByFilter('crm_opportunities', 'active = true', '-created', 500, 0).map((item) => ({ id: item.id, code: item.getString('opportunity_number'), client: rights.includes('contacts.read') && item.getString('company') ? c.get(app, 'contacts_companies', item.getString('company')).getString('name') : '', name: `${item.getString('opportunity_number')} · ${item.getString('title')}`, allocation_label: [item.getString('opportunity_number'), rights.includes('contacts.read') && item.getString('company') ? c.get(app, 'contacts_companies', item.getString('company')).getString('name') : '', item.getString('title')].filter(Boolean).join(' · '), currency: item.getString('currency') })) : [], units: app.findRecordsByFilter('inventory_units', 'active = true', 'label', 500, 0).map((item) => ({ code: item.getString('code'), label: item.getString('label') })), currencies: app.findRecordsByFilter('accounting_currencies', 'active = true', 'code', 100, 0).map((item) => item.getString('code')), settings: app.findAllRecords('settings_purchasing')[0].publicExport() }) },
  product(event) { c.guard(event.app, event.auth); return event.json(200, require(`${__hooks}/lib/catalog-procurement.js`)(event.app, event.auth, event.request.pathValue('id'), event.requestInfo().query.supplier || '', event.requestInfo().query.currency || '')) },
  list(event, kind) {
    c.guard(event.app, event.auth); const app = event.app, query = event.requestInfo().query, filters = [], params = {}; c.exact(query, ['q', 'status', 'supplier', 'opportunity', 'product', 'source_order', 'source_line', 'request_line', 'request', 'order', 'page', 'sort', 'group'])
    const statusFilters = [query.status === 'archived' ? 'archived_at != ""' : 'archived_at = ""']
    if (query.status && !['all', 'archived'].includes(query.status)) { params.status = query.status; statusFilters.push('status = {:status}') }
    for (const key of ['supplier', 'source_order']) if (query[key]) { params[key] = query[key]; filters.push(key === 'supplier' && kind === 'request' ? 'purchasing_request_lines_via_request.suggested_supplier ?= {:supplier}' : key === 'source_order' && kind === 'order' ? 'purchasing_order_lines_via_order.request_line.request.source_order ?= {:source_order}' : `${key} = {:${key}}`) }
    if (query.order) { if (kind !== 'request') throw new BadRequestError('Filtre réservé aux demandes d’achat.'); const order = c.get(app, 'purchasing_orders', query.order); params.order = order.id; params.root_request = order.getString('request'); filters.push('(id = {:root_request} || purchasing_request_lines_via_request.purchasing_order_lines_via_request_line.order ?= {:order})') }
    if (query.request) { if (kind !== 'order') throw new BadRequestError('Filtre réservé aux commandes fournisseurs.'); params.request = query.request; filters.push('(request = {:request} || purchasing_order_lines_via_order.request_line.request ?= {:request})') }
    if (query.opportunity) { if (!c.policy.permissions(app, event.auth).includes('crm.read')) throw new ForbiddenError('Accès CRM nécessaire.'); params.opportunity = query.opportunity; const link = kind === 'request' ? 'request' : 'order'; filters.push(`purchasing_${kind}_lines_via_${link}.purchasing_${kind}_line_allocations_via_${kind}_line.analytic_account.opportunity ?= {:opportunity}`) }
    for (const key of ['product', 'source_line', 'request_line']) if (query[key]) { params[key] = query[key]; const link = kind === 'request' ? 'request' : 'order'; filters.push(`purchasing_${kind}_lines_via_${link}.${key === 'source_line' && kind === 'order' ? 'request_line.source_line' : key} ?= {:${key}}`) }
    if (query.q) { params.q = String(query.q).slice(0, 200); filters.push(`(title ~ {:q} || ${kind}_number ~ {:q}${kind === 'order' ? ' || supplier.name ~ {:q}' : ''})`) }
    const summaryRecords = app.findRecordsByFilter(table(kind), ['archived_at = ""', ...filters].join(' && '), '', 10001, 0, params), summary = {}
    if (summaryRecords.length > 10000) throw new BadRequestError('Affinez les filtres pour limiter la synthèse à 10 000 pièces.')
    for (const record of summaryRecords) { const status = record.getString('status'); summary[status] = (summary[status] || 0) + 1 }
    const filter = [...statusFilters, ...filters].join(' && '), page = Math.max(1, Number(query.page) || 1), total = app.findRecordsByFilter(table(kind), filter, '', 10001, 0, params).length, sort = ['-created', 'title', kind + '_number', 'document_date'].includes(query.sort) ? query.sort : '-created'
    if (total > 10000) throw new BadRequestError('Affinez les filtres pour limiter la liste à 10 000 pièces.');
    return event.json(200, { items: app.findRecordsByFilter(table(kind), filter, sort + ',id', 30, (page - 1) * 30, params).map((record) => c.dto(app, event.auth, kind, record)), page, totalItems: total, totalPages: Math.max(1, Math.ceil(total / 30)), summary })
  },
  record(event, kind) { c.guard(event.app, event.auth); return event.json(200, c.dto(event.app, event.auth, kind, c.get(event.app, table(kind), event.request.pathValue('id')))) },
  needs(event) { return event.json(200, needsFor(event.app, event.auth, event.request.pathValue('id'), event.requestInfo().query.preview === 'true')) },
  prepareConfirmed(app, user, quoteId, selections) {
    c.guard(app, user, 'write')
    if (!Array.isArray(selections) || !selections.length || selections.length > 200) throw new BadRequestError('Choisissez au moins une ligne à acheter.')
    const needs = needsFor(app, user, quoteId), seen = new Set()
    const lines = selections.map((selection) => {
      c.exact(selection, ['source_line', 'quantity', 'supplier'])
      if (seen.has(selection.source_line)) throw new BadRequestError('Ligne d’achat répétée.')
      seen.add(selection.source_line)
      const source = app.findRecordsByFilter('sales_order_lines', 'order = {:order} && source_line = {:line}', '', 1, 0, { order: needs.source_order, line: selection.source_line })[0]
      const line = needs.lines.find((item) => item.source_line === source?.id)
      if (!line || line.quantity <= 0) throw new BadRequestError('Ligne d’achat indisponible.')
      const quantity = c.number(selection.quantity, 0.000001, line.quantity)
      return { source_line: line.source_line, product: line.product, description: line.description, reference: line.reference, brand: line.brand, unit: line.unit, unit_price: line.unit_price, discount: line.discount, allocations: line.allocations, quantity, supplier: selection.supplier || line.supplier, request_line: '' }
    })
    const settings = app.findAllRecords('settings_purchasing')[0], date = new Date(), needed = new Date(date.getTime() + settings.getInt('default_lead_days') * 86400000)
    const input = normalize(app, user, { title: needs.title, opportunity: needs.opportunity, source_order: needs.source_order, source_quote: needs.source_quote, document_date: date.toISOString().slice(0, 10), needed_date: needed.toISOString().slice(0, 10), currency: needs.currency, exchange_rate: app.findRecordById('sales_quotes', quoteId).getFloat('exchange_rate'), notes: '', lines }, 'request')
    const record = new Record(app.findCollectionByNameOrId('purchasing_requests'))
    writeDraft(app, user, 'request', record, input, `confirmation-${needs.source_order}`, c.hash(input), null)
    return record.id
  },

  save(event, kind) {
    c.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'creation_key', 'input']); let result
    event.app.runInTransaction((app) => {
      c.guard(app, event.auth, 'write'); const hash = c.hash(body.input), record = body.id ? c.get(app, table(kind), body.id) : new Record(app.findCollectionByNameOrId(table(kind)))
      if (!body.id) { if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.'); const previous = app.findRecordsByFilter(table(kind), 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]; if (previous) { if (previous.getString('created_by') !== event.auth.id || previous.getString('creation_hash') !== hash) throw new ApiError(409, 'Cette création existe avec d’autres valeurs.'); result = c.dto(app, event.auth, kind, previous); return } }
      else { checkVersion(record, body.updated); if (record.getString('status') !== 'draft' || record.getString('archived_at')) throw new BadRequestError('Seul un brouillon actif peut être modifié.') }
      const input = normalize(app, event.auth, body.input, kind), before = body.id ? record.publicExport() : null
      if (kind === 'request' && body.id && input.source_order !== record.getString('source_order')) throw new BadRequestError('La source de la demande ne peut pas changer.')
      const amounts = new Map(); for (const line of input.lines) if (kind === 'request' && line.source_line || kind === 'order' && line.request_line) { const key = kind === 'request' ? line.source_line : line.request_line; amounts.set(key, (amounts.get(key) || 0) + line.quantity) }
      for (const [id, quantity] of amounts) { const source = c.get(app, kind === 'request' ? 'sales_order_lines' : 'purchasing_request_lines', id); const existing = kind === 'request' ? c.requested(app, id, record.id) + Math.max(0, reserved(app, id) + require(`${__hooks}/lib/stock-operations.js`).consumed(app, 'sales_quote', c.get(app, 'sales_orders', source.getString('order')).getString('quote'), ['OUT', 'PREP'], id) - require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, id, record.id)) : app.findRecordsByFilter('purchasing_order_lines', 'request_line = {:id} && order.status != "cancelled" && order.id != {:own}', '', 0, 0, { id, own: record.id }).reduce((sum, line) => sum + line.getFloat('quantity'), 0); if (existing + quantity > source.getFloat('quantity') + 0.000001) throw new ApiError(409, 'La quantité restante a changé. Rechargez la préparation.') }
      writeDraft(app, event.auth, kind, record, input, body.creation_key, hash, before)
      result = c.dto(app, event.auth, kind, record)
    }); return event.json(200, result)
  },
  transition(event, kind) {
    const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'action', 'discard_preparations']); if (!['validate', 'reopen', 'cancel', 'cancel_all', 'archive', 'restore'].includes(body.action)) throw new BadRequestError('Transition invalide.'); c.guard(event.app, event.auth, ['validate', 'reopen'].includes(body.action) ? `${kind}.validate` : 'write'); let result
    event.app.runInTransaction((app) => { c.guard(app, event.auth, ['validate', 'reopen'].includes(body.action) ? `${kind}.validate` : 'write'); const record = c.get(app, table(kind), body.id); checkVersion(record, body.updated); const before = record.publicExport()
      if (['archive', 'restore'].includes(body.action)) record.set('archived_at', body.action === 'archive' ? new Date().toISOString() : '')
      else {
        if (record.getString('archived_at')) throw new BadRequestError('Réactivez la pièce.')
        if (body.action === 'validate') { if (record.getString('status') !== 'draft' || !c.rows(app, kind, record.id).length) throw new BadRequestError('Ajoutez des lignes au brouillon avant validation.'); validateLines(app, kind, record); if (record.getString('currency') !== 'EUR' && record.getFloat('exchange_rate') <= 0) throw new BadRequestError('Renseignez un taux de change explicite.'); if (record.getString('source_order')) { const sourceOrder = c.get(app, 'sales_orders', record.getString('source_order')); if (sourceOrder.getString('status') !== 'confirmed') throw new BadRequestError('La commande client n’est plus confirmée.') }; if (kind === 'order') { c.supplier(app, record.getString('supplier')); const buyer = c.get(app, 'core_users', record.getString('owner')); if (!buyer.getBool('active') || !c.allowed(app, buyer, 'write')) throw new BadRequestError('Choisissez un acheteur actif habilité aux achats.'); require(`${__hooks}/lib/stock.js`).deliveryWarehouse(app, event.auth, record.getString('delivery_warehouse'), true); for (const line of c.rows(app, kind, record.id).filter((line) => line.getString('request_line'))) { const request = c.get(app, 'purchasing_requests', c.get(app, 'purchasing_request_lines', line.getString('request_line')).getString('request')); if (request.getString('status') === 'cancelled' || request.getString('archived_at')) throw new BadRequestError('La demande source n’est plus disponible.') } }; record.set('status', 'validated'); record.set('validated_at', new Date().toISOString()); record.set('validated_by', event.auth.id); record.set('exchange_rate_locked_at', new Date().toISOString()); record.set('exchange_rate_source', 'manual'); record.set('exchange_rate_date', record.getString('document_date')); if (kind === 'order') { record.set('document_snapshot', null); record.set('document_snapshot', { ...c.dto(app, event.auth, kind, record), supplier_fields: require(`${__hooks}/lib/contacts-document-context.js`)(app, c.supplier(app, record.getString('supplier'))).fields }) } }
        else if (body.action === 'cancel_all') {
          if (kind !== 'request' || record.getString('status') === 'cancelled') throw new BadRequestError('Choisissez une demande active.')
          c.guard(app, event.auth, 'request.validate'); c.guard(app, event.auth, 'order.validate')
          const orders = c.linkedOrders(app, record.id)
          if (orders.some((order) => !['draft', 'validated'].includes(order.getString('status')) || order.getString('sent_at'))) throw new BadRequestError('Une commande a déjà été envoyée ou réceptionnée. Annulation globale indisponible.')
          if (orders.some((order) => c.rows(app, 'order', order.id).some((line) => !line.getString('request_line') || c.get(app, 'purchasing_request_lines', line.getString('request_line')).getString('request') !== record.id))) throw new BadRequestError('Une commande est partagée avec une autre demande. Traitez-la séparément pour préserver les autres affaires.')
          for (const order of orders) {
            const previous = order.publicExport()
            if (order.getString('status') === 'draft') order.set('document_snapshot', { ...c.dto(app, event.auth, 'order', order), supplier_fields: require(`${__hooks}/lib/contacts-document-context.js`)(app, c.get(app, 'contacts_companies', order.getString('supplier'))).fields })
            order.set('status', 'cancelled'); app.save(order); require(`${__hooks}/lib/stock-operations.js`).syncPurchase(app, event.auth, order); c.audit(app, event.auth, order, previous, 'Commande annulée avec la demande d’achat')
          }
          record.set('status', 'cancelled')
        }
        else if (body.action === 'reopen') {
          c.guard(app, event.auth, 'write')
          if (kind === 'order') {
            if (record.getString('status') !== 'validated' || record.getString('sent_at')) throw new BadRequestError('Seule une commande validée jamais envoyée peut revenir en brouillon.')
          } else {
            if (!['validated', 'partially_ordered'].includes(record.getString('status'))) throw new BadRequestError('Seule une demande validée non traitée peut revenir en brouillon.')
            const preparations = c.linkedOrders(app, record.id)
            if (preparations.some((order) => order.getString('status') !== 'draft' || order.getString('sent_at'))) throw new BadRequestError('Remettez d’abord les commandes fournisseurs non envoyées en brouillon. Les commandes déjà envoyées sont conservées.')
            if (preparations.length && body.discard_preparations !== true) throw new BadRequestError('Confirmez le retrait des préparations fournisseurs pour revenir en brouillon.')
            for (const order of preparations) {
              const previous = order.publicExport(), orderLines = c.rows(app, 'order', order.id), affected = orderLines.filter((line) => line.getString('request_line') && c.get(app, 'purchasing_request_lines', line.getString('request_line')).getString('request') === record.id)
              if (affected.length === orderLines.length) {
                order.set('document_snapshot', { ...c.dto(app, event.auth, 'order', order), supplier_fields: require(`${__hooks}/lib/contacts-document-context.js`)(app, c.get(app, 'contacts_companies', order.getString('supplier'))).fields })
                order.set('request', record.id); for (const line of affected) { line.set('request_line', ''); app.save(line) }; order.set('status', 'cancelled'); app.save(order); require(`${__hooks}/lib/stock-operations.js`).syncPurchase(app, event.auth, order)
              } else {
                for (const line of affected) { for (const allocation of app.findRecordsByFilter('purchasing_order_line_allocations', 'order_line = {:id}', '', 0, 0, { id: line.id })) app.delete(allocation); app.delete(line) }
                const remaining = c.rows(app, 'order', order.id)
                order.set('subtotal', remaining.reduce((total, line) => total + Math.round(line.getFloat('line_total') * 100), 0) / 100)
                order.set('tax', remaining.reduce((total, line) => total + Math.round(line.getFloat('tax_amount') * 100), 0) / 100)
                order.set('total', Math.round((order.getFloat('subtotal') + order.getFloat('tax')) * 100) / 100); app.save(order)
              }
              c.audit(app, event.auth, order, previous, 'Préparation retirée après retour de la demande en brouillon')
            }
          }
          record.set('status', 'draft')
        }
        else { if (kind === 'request' && c.rows(app, kind, record.id).some((line) => c.orderQuantity(app, line.id) > 0)) throw new BadRequestError('Annulez d’abord les commandes fournisseurs liées.'); if (['received', 'partially_received', 'closed', 'completed'].includes(record.getString('status'))) throw new BadRequestError('La pièce est déjà exécutée.'); record.set('status', 'cancelled') }
      }
      app.save(record); if (kind === 'order') require(`${__hooks}/lib/stock-operations.js`).syncPurchase(app, event.auth, record); if (kind === 'request' && body.action === 'validate') { c.guard(app, event.auth, 'write'); const selections = c.rows(app, kind, record.id).map((line) => ({ id: line.id, quantity: line.getFloat('quantity'), supplier: line.getString('suggested_supplier') })); if (selections.some((line) => !line.supplier)) throw new BadRequestError('Choisissez un fournisseur pour chaque ligne avant de valider la demande.'); prepareOrders(app, event.auth, selections, $security.randomString(32)) }; c.audit(app, event.auth, record, before, body.action === 'validate' ? 'Pièce d’achat validée' : body.action === 'reopen' ? 'Pièce d’achat remise en brouillon' : ['cancel', 'cancel_all'].includes(body.action) ? 'Pièce d’achat annulée' : body.action === 'archive' ? 'Pièce archivée' : 'Pièce réactivée'); result = c.dto(app, event.auth, kind, record)
    }); return event.json(200, result)
  },
  generateOrders(event) {
    c.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body; c.exact(body, ['creation_key', 'lines']); if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 200) throw new BadRequestError('Sélectionnez les lignes à commander.'); let result
    event.app.runInTransaction((app) => {
      c.guard(app, event.auth, 'write'); if (!/^[a-zA-Z0-9-]{16,90}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.'); const hash = c.hash(body.lines), prior = app.findRecordsByFilter('purchasing_orders', 'creation_key ~ {:key}', 'order_number', 0, 0, { key: body.creation_key + '-group-' }); if (prior.length) { if (prior.some((record) => record.getString('creation_hash') !== hash || record.getString('created_by') !== event.auth.id)) throw new ApiError(409, 'Cette opération existe avec d’autres valeurs.'); result = prior.map((record) => c.dto(app, event.auth, 'order', record)); return }
      result = prepareOrders(app, event.auth, body.lines, body.creation_key)
    }); return event.json(200, { items: result })
  },
  lineTracking(app, user, orderLine) {
    if (!c.allowed(app, user)) return null
    const requestLines = app.findRecordsByFilter('purchasing_request_lines', 'source_line = {:id} && request.status != "cancelled"', '', 0, 0, { id: orderLine.id }), stockRead = c.policy.permissions(app, user).includes('inventory.read'), received = require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, orderLine.id), delivered = require(`${__hooks}/lib/stock-operations.js`).consumed(app, 'sales_quote', c.get(app, 'sales_orders', orderLine.getString('order')).getString('quote'), ['OUT', 'PREP'], orderLine.id), held = reserved(app, orderLine.id)
    return { ordered: requestLines.reduce((sum, line) => sum + c.orderQuantity(app, line.id, true), 0), prepared: requestLines.reduce((sum, line) => sum + line.getFloat('quantity'), 0), needed: Math.max(0, orderLine.getFloat('quantity') - Math.max(0, held + delivered - received)), reserved: held, source_line: orderLine.id, received: stockRead ? received : null, delivered: stockRead ? delivered : null }
  },
  incoming(app, user, product) { if (!c.allowed(app, user)) return null; return app.findRecordsByFilter('purchasing_order_lines', 'product = {:id} && (order.status = "validated" || order.status = "sent" || order.status = "acknowledged" || order.status = "partially_received")', '', 0, 0, { id: product }).reduce((sum, line) => sum + Math.max(0, line.getFloat('quantity') - require(`${__hooks}/lib/stock-operations.js`).consumed(app, 'purchase_order', line.getString('order'), ['IN', 'OUT'], line.id)), 0) },
  productHistory(app, user, product) {
    if (!c.allowed(app, user)) return null
    return app.findRecordsByFilter('purchasing_order_lines', 'product = {:id} && order.status != "draft" && order.status != "cancelled"', '-order.document_date,-order.validated_at,-created,id', 100, 0, { id: product }).map((line) => {
      const order = c.get(app, 'purchasing_orders', line.getString('order')), snapshot = JSON.parse(order.getString('document_snapshot') || 'null')
      return { id: line.id, order: order.id, number: order.getString('order_number'), date: order.getString('document_date'), supplier_name: snapshot?.supplier_name || c.get(app, 'contacts_companies', order.getString('supplier')).getString('name'), reference: line.getString('reference'), quantity: line.getFloat('quantity'), unit: line.getString('unit'), unit_price: line.getFloat('unit_price'), discount: line.getFloat('discount'), total: line.getFloat('line_total'), currency: order.getString('currency') }
    })
  },
  lastPurchase(app, user, product) { if (!c.allowed(app, user)) return null; const line = app.findRecordsByFilter('purchasing_order_lines', 'product = {:id} && order.status != "draft" && order.status != "cancelled"', '-order.document_date,-order.validated_at,-created,id', 1, 0, { id: product })[0]; if (!line) return null; const order = c.get(app, 'purchasing_orders', line.getString('order')); return { unit_cost: line.getFloat('unit_price') * (1 - line.getFloat('discount') / 100), date: order.getString('document_date'), currency: order.getString('currency'), unit: line.getString('unit'), supplier_name: c.get(app, 'contacts_companies', order.getString('supplier')).getString('name') } },
  assertReturn(app, order) { if (app.findRecordsByFilter('inventory_operations', 'sales_quote = {:id} && status != "cancelled"', '', 1, 0, { id: order.getString('quote') }).length) throw new BadRequestError('Une opération de stock est liée à cette commande. Son exécution doit être conservée.'); if (app.findRecordsByFilter('purchasing_requests', 'source_order = {:id} && status != "cancelled"', '', 1, 0, { id: order.id }).length) throw new BadRequestError('Annulez les demandes et achats liés avant de revenir en devis.') },
  settings(event) {
    c.guard(event.app, event.auth); let record = event.app.findAllRecords('settings_purchasing')[0]
    if (event.request.method === 'POST') {
      const body = event.requestInfo().body; c.exact(body, ['updated', 'default_tax_rate', 'default_lead_days'])
      event.app.runInTransaction((app) => {
        if (!c.policy.settings(app, event.auth)) throw new ForbiddenError('Paramétrage réservé aux administrateurs habilités.')
        record = app.findAllRecords('settings_purchasing')[0]; checkVersion(record, body.updated); const before = record.publicExport()
        record.set('default_tax_rate', c.number(body.default_tax_rate, 0, 100)); const days = c.number(body.default_lead_days, 0, 365); if (!Number.isInteger(days)) throw new BadRequestError('Le délai doit être un nombre entier de jours.'); record.set('default_lead_days', days)
        app.save(record); c.policy.audit(app, 'settings_purchasing', record.id, event.auth.id, before, record.publicExport(), 'update')
      })
    }
    return event.json(200, record.publicExport())
  },
}
