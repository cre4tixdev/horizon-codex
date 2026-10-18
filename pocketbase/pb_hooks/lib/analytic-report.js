const policy = require(`${__hooks}/lib/access-policy.js`)
const get = (app, collection, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Référence invalide.'); try { return app.findRecordById(collection, id) } catch { throw new ApiError(404, 'Affaire introuvable.') } }
const rows = (app, collection, filter, params) => app.findRecordsByFilter(collection, filter, 'id', 0, 0, params)
const json = (record, key) => JSON.parse(record.getString(key) || 'null')
const safeCents = (amount) => { if (!Number.isSafeInteger(amount)) throw new BadRequestError('Montant trop important pour être consolidé.'); return amount }
const cents = (amount) => safeCents(Math.round(amount * 100))
const capabilities = (app, user) => {
  const rights = policy.permissions(app, user), admin = policy.admin(app, user)
  if (!admin && !rights.includes('analysis.read')) throw new ForbiddenError('Accès à l’analyse des affaires refusé.')
  return { financial: admin || rights.includes('analysis.financial'), labor_costs: admin || rights.includes('analysis.financial') && rights.includes('analysis.labor_costs'), scope: admin ? 'all' : policy.grantsFor(app, user).analysis?.scope || 'own' }
}
// Old validated documents keep their root allocation; their explicit source identifies the child.
const purchaseAccount = (app, allocation, line) => {
  const account = get(app, 'accounting_analytic_accounts', allocation.getString('analytic_account'))
  if (account.getString('parent')) return account.id
  const request = line.getString('request_line') ? get(app, 'purchasing_request_lines', line.getString('request_line')) : null
  if (!request?.getString('source_line')) return account.id
  const source = get(app, 'sales_order_lines', request.getString('source_line')), order = get(app, 'sales_orders', source.getString('order'))
  return order.getString('analytic_account') === account.id ? order.getString('analytic_child') || account.id : account.id
}
const moveAccount = (app, move) => {
  const id = move.getString('analytic_account')
  if (!id) return ''
  const account = get(app, 'accounting_analytic_accounts', id)
  if (account.getString('parent') || !move.getString('operation')) return id
  const operation = get(app, 'inventory_operations', move.getString('operation'))
  if (!operation.getString('sales_quote')) return id
  const child = rows(app, 'accounting_analytic_accounts', 'source_quote = {:quote} && parent = {:root}', { quote: operation.getString('sales_quote'), root: id })[0]
  return child?.id || id
}
const money = (value) => value / 100
const empty = (account, quote) => ({ id: account.id, code: account.getString('code'), label: account.getString('label'), quote: quote?.id || '', confirmed: quote?.getString('status') === 'accepted', item_lines: 0, delivered_lines: 0, revenue: 0, planned_cost: 0, purchases_committed: 0, stock_consumed: 0 })
function report(app, user, opportunity, quoteId) {
  const access = capabilities(app, user)
  if (access.scope !== 'all' && opportunity.getString('owner') !== user.id) throw new ForbiddenError('Cette affaire est hors de votre périmètre d’analyse.')
  const root = get(app, 'accounting_analytic_accounts', opportunity.getString('analytic_account'))
  const children = app.findRecordsByFilter('accounting_analytic_accounts', 'parent = {:id}', 'code,id', 0, 0, { id: root.id })
  const accounts = [root, ...children], ids = new Set(accounts.map((item) => item.id))
  const buckets = new Map(accounts.map((account) => [account.id, empty(account, account.getString('source_quote') ? get(app, 'sales_quotes', account.getString('source_quote')) : null)]))
  const currency = opportunity.getString('currency')
  const times = require(`${__hooks}/lib/time-analysis.js`)(app, accounts.map((account) => account.id), currency)
  for (const bucket of buckets.values()) bucket.hours = times.accounts.get(bucket.id)
  const orders = rows(app, 'sales_orders', 'opportunity = {:id}', { id: opportunity.id })
  for (const order of orders.filter((order) => order.getString('status') === 'confirmed')) {
    const bucket = buckets.get(order.getString('analytic_child'))
    if (!bucket) continue
    const lines = rows(app, 'sales_order_lines', 'order = {:id} && kind = "item"', { id: order.id })
    const logistics = lines.filter((line) => line.getString('product') && get(app, 'inventory_products', line.getString('product')).getString('stock_policy') !== 'none')
    bucket.item_lines += logistics.length
    for (const line of logistics) {
      const deliveries = require(`${__hooks}/lib/stock-operations.js`).deliveryTracking(app, order.getString('quote'), line.id).delivered
      if (deliveries + 0.000001 >= line.getFloat('quantity')) bucket.delivered_lines++
    }
    if (access.financial) {
      if (order.getString('currency') !== currency) throw new BadRequestError('Les devises des commandes ne permettent pas une consolidation unique.')
      bucket.revenue = safeCents(bucket.revenue + cents(order.getFloat('subtotal')))
      const snapshot = order.getString('current_revision') ? json(get(app, 'sales_order_revisions', order.getString('current_revision')), 'after_snapshot').header : json(order, 'quote_snapshot') || {}
      bucket.planned_cost = safeCents(bucket.planned_cost + cents(snapshot.cost_total ?? lines.reduce((sum, line) => sum + line.getFloat('quantity') * line.getFloat('unit_cost'), 0)))
    }
  }
  let stockCurrencyMismatch = false
  if (access.financial) {
    // Purchase commitments and stock consumption remain separate, never added twice.
    for (const allocation of rows(app, 'purchasing_order_line_allocations', 'analytic_account.opportunity = {:id}', { id: opportunity.id })) {
      if (!ids.has(allocation.getString('analytic_account'))) continue
      const line = get(app, 'purchasing_order_lines', allocation.getString('order_line')), order = get(app, 'purchasing_orders', line.getString('order'))
      if (['draft', 'cancelled'].includes(order.getString('status'))) continue
      const bucket = buckets.get(purchaseAccount(app, allocation, line))
      if (!bucket) continue
      if (order.getString('currency') !== currency) throw new BadRequestError('Une ventilation d’achat est dans une devise différente de l’affaire.')
      const portions = app.findRecordsByFilter('purchasing_order_line_allocations', 'order_line = {:id}', 'created,id', 0, 0, { id: line.id })
      const allocated = require(`${__hooks}/lib/analytic-math.js`).allocationCents(line.getFloat('line_total'), portions.map((item) => item.getFloat('quantity')), line.getFloat('quantity'))
      bucket.purchases_committed = safeCents(bucket.purchases_committed + allocated[portions.findIndex((item) => item.id === allocation.id)])
    }
    for (const move of rows(app, 'inventory_moves', 'analytic_account.opportunity = {:id}', { id: opportunity.id })) {
      if (!move.getString('operation')) continue
      const operation = get(app, 'inventory_operations', move.getString('operation'))
      const origin = operation.getString('origin') ? get(app, 'inventory_operations', operation.getString('origin')) : null
      if (!['OUT', 'PREP'].includes(operation.getString('kind')) && !(operation.getString('kind') === 'RET' && origin && ['OUT', 'PREP'].includes(origin.getString('kind')))) continue
      const bucket = buckets.get(moveAccount(app, move))
      if (!bucket) continue
      const entry = rows(app, 'inventory_valuation_entries', 'move = {:id}', { id: move.id })[0]
      if (!entry) continue
      if (entry.getString('currency') !== currency) { stockCurrencyMismatch = true; continue }
      bucket.stock_consumed = safeCents(bucket.stock_consumed - cents(entry.getFloat('movement_value')))
    }
  }
  const project = (bucket) => ({ id: bucket.id, code: bucket.code, label: bucket.label, quote: bucket.quote, confirmed: bucket.confirmed, item_lines: bucket.item_lines, delivered_lines: bucket.delivered_lines, hours: bucket.hours, ...(access.financial ? { financial: { revenue: money(bucket.revenue), planned_cost: money(bucket.planned_cost), planned_margin: money(safeCents(bucket.revenue - bucket.planned_cost)), planned_margin_percent: bucket.revenue ? (bucket.revenue - bucket.planned_cost) / bucket.revenue * 100 : null, purchases_committed: money(bucket.purchases_committed), stock_consumed: stockCurrencyMismatch ? null : money(bucket.stock_consumed), actual_labor_cost: Object.hasOwn(bucket, 'labor_cost') ? bucket.labor_cost : times.costs.get(bucket.id)?.supplied ? money(times.costs.get(bucket.id).cents) : null } } : {}) })
  const all = [...buckets.values()], selected = quoteId ? all.filter((bucket) => bucket.quote === quoteId) : all
  const totals = selected.reduce((sum, bucket) => ({ ...sum, item_lines: sum.item_lines + bucket.item_lines, delivered_lines: sum.delivered_lines + bucket.delivered_lines, revenue: safeCents(sum.revenue + bucket.revenue), planned_cost: safeCents(sum.planned_cost + bucket.planned_cost), purchases_committed: safeCents(sum.purchases_committed + bucket.purchases_committed), stock_consumed: safeCents(sum.stock_consumed + bucket.stock_consumed) }), empty(root, null))
  totals.hours = { be: { planned_minutes: 0, actual_minutes: 0, pending_minutes: 0 }, production: { planned_minutes: 0, actual_minutes: 0, pending_minutes: 0 } }
  for (const bucket of selected) for (const work of ['be', 'production']) for (const key of ['planned_minutes', 'actual_minutes', 'pending_minutes']) totals.hours[work][key] = safeCents(totals.hours[work][key] + bucket.hours[work][key])
  totals.labor_cost = selected.every((bucket) => times.costs.get(bucket.id)?.supplied) ? money(selected.reduce((n, bucket) => safeCents(n + times.costs.get(bucket.id).cents), 0)) : null
  const projectedTotals = project(totals)
  if (access.financial) projectedTotals.financial.estimated_revenue = money(cents(opportunity.getFloat('estimated_value')))
  return { root: { id: root.id, code: root.getString('code'), opportunity: opportunity.id, label: root.getString('label'), client: get(app, 'contacts_companies', opportunity.getString('company')).getString('name') }, currency, capabilities: access, accounts: selected.map(project), totals: projectedTotals, coverage: { time: times.time, time_be: times.time_be, time_production: times.time_production, planning: times.planning, expenses: false, billing: false, labor_costs: access.financial && selected.every((bucket) => times.costs.get(bucket.id)?.supplied), stock_currency_mismatch: stockCurrencyMismatch } }
}
module.exports = {
  list(event) {
    const app = event.app, access = capabilities(app, event.auth), query = event.requestInfo().query
    if (Object.keys(query).some((key) => !['q', 'status', 'page', 'sort', 'group'].includes(key))) throw new BadRequestError('Filtres non autorisés.')
    if (query.status && !['open', 'won', 'completed', 'lost', 'cancelled', 'archived'].includes(query.status)) throw new BadRequestError('État invalide.')
    const page = Number(query.page || 1)
    if (!Number.isInteger(page) || page < 1) throw new BadRequestError('Page invalide.')
    const conditions = ['analytic_account != ""', query.status === 'archived' ? 'active = false' : 'active = true'], params = {}
    if (access.scope !== 'all') { conditions.push('owner = {:owner}'); params.owner = event.auth.id }
    if (query.status && query.status !== 'archived') { conditions.push('status = {:status}'); params.status = query.status }
    if (query.q) { if (query.q.length > 200) throw new BadRequestError('Recherche trop longue.'); conditions.push('(title ~ {:q} || opportunity_number ~ {:q} || company.name ~ {:q})'); params.q = query.q }
    const filter = conditions.join(' && '), totalItems = app.findRecordsByFilter('crm_opportunities', filter, 'id', 0, 0, params).length
    const sort = { code: 'opportunity_number,id', title: 'title,id', '-created': '-created,id' }[query.sort || 'code']
    if (!sort) throw new BadRequestError('Tri invalide.')
    const items = app.findRecordsByFilter('crm_opportunities', filter, sort, 30, (page - 1) * 30, params).map((opportunity) => report(app, event.auth, opportunity))
    return event.json(200, { items, page, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / 30)) })
  },
  read(event) {
    const query = event.requestInfo().query
    if (Object.keys(query).some((key) => !['opportunity', 'quote'].includes(key)) || Boolean(query.opportunity) === Boolean(query.quote)) throw new BadRequestError('Choisissez une affaire ou une commande.')
    capabilities(event.app, event.auth)
    const quote = query.quote ? get(event.app, 'sales_quotes', query.quote) : null
    const opportunity = get(event.app, 'crm_opportunities', quote ? quote.getString('opportunity') : query.opportunity)
    try { return event.json(200, report(event.app, event.auth, opportunity, quote?.id)) } catch (error) { console.error('[analysis] Report failed', String(error)); throw error }
  },
  capabilities, report,
}
