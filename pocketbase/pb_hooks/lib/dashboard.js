const sources = { contacts: { contacts_companies: '/contacts/companies/', contacts_people: '/contacts/people/' }, crm: { crm_opportunities: '/crm/opportunities/', crm_tenders: '/crm/tenders/' }, sales: { sales_quotes: '/sales/quotes/' }, inventory: { inventory_products: '/inventory/products/', inventory_operations: '/inventory/operations/' }, purchasing: { purchasing_requests: '/purchasing/requests/', purchasing_orders: '/purchasing/orders/' } }
const policy = require(`${__hooks}/lib/access-policy.js`)
const sourceLabel = (record) => {
  const title = record.collection().name === 'contacts_people' ? [record.getString('first_name'), record.getString('last_name')].filter(Boolean).join(' ') : record.getString('title') || record.getString('name')
  const code = ['opportunity_number', 'reference', 'quote_number', 'request_number', 'order_number', 'number', 'sku'].map((field) => record.getString(field)).find(Boolean)
  return [code, title].filter(Boolean).join(' · ')
}
const guard = (event) => {
  const rights = policy.permissions(event.app, event.auth)
  if (!rights.length) throw new ForbiddenError('Accès au dashboard refusé.')
  return rights
}
const records = (app, collection, filter, params) => {
  const items = app.findRecordsByFilter(collection, filter, '', 10001, 0, params)
  if (items.length > 10000) throw new BadRequestError('Période trop large. Choisissez une période plus courte.')
  return items
}
module.exports = {
  metrics(event) {
    const rights = guard(event), query = event.request.url.query(), dates = require(`${__hooks}/lib/purchasing-common.js`)
    const from = dates.date(query.get('from'), true), to = dates.date(query.get('to'), true)
    if (from > to || Date.parse(to) - Date.parse(from) > 366 * 86400000) throw new BadRequestError('Choisissez une période de moins d’un an.')
    const helpers = require(`${__hooks}/lib/dashboard-metrics.js`)
    const metric = (rows, field, description, withMargin = false, missing = 0) => ({ values: helpers.aggregate(rows, field, withMargin), description, missing, trend: helpers.trend(rows, field, from, to) })
    const params = { from, to: `${to} 23:59:59.999Z`, wideFrom: new Date(Date.parse(from) - 86400000).toISOString().replace('T', ' '), wideTo: new Date(Date.parse(to) + 2 * 86400000).toISOString().replace('T', ' ') }
    const day = (value) => new DateTime(value).time().in(new Timezone('Europe/Paris')).format('2006-01-02')
    const inPeriod = (value) => { const date = day(value); return date >= from && date <= to }
    let forecast = null, ordered = null, margin = null, committed = null
    if (rights.includes('crm.read')) {
      const rows = records(event.app, 'crm_opportunities', 'active = true && status != "lost" && status != "cancelled" && expected_date >= {:from} && expected_date <= {:to}', params).map((record) => ({ date: record.getString('expected_date').slice(0, 10), currency: record.getString('currency'), amount: record.getFloat('estimated_value') }))
      const missing = records(event.app, 'crm_opportunities', 'active = true && status != "lost" && status != "cancelled" && expected_date = ""', {}).length
      forecast = metric(rows, 'amount', 'Opportunités actives selon leur date prévue, sans pondération. Opportunités sans date exclues.', false, missing)
    }
    if (rights.includes('sales.read')) {
      const orders = records(event.app, 'sales_orders', 'status != "draft" && status != "cancelled" && order_date >= {:wideFrom} && order_date < {:wideTo}', params).filter((record) => inPeriod(record.getString('order_date')))
      const rows = orders.map((record) => {
        const snapshot = JSON.parse(record.getString('quote_snapshot') || '{}'), subtotal = record.getFloat('subtotal')
        let cost = null
        if (typeof snapshot.cost_total === 'number' && Math.round(snapshot.subtotal * 100) === Math.round(subtotal * 100)) cost = snapshot.cost_total
        else {
          const lines = event.app.findRecordsByFilter('sales_order_lines', 'order = {:id} && kind = "item"', '', 0, 0, { id: record.id })
          if (lines.length) cost = lines.reduce((sum, line) => sum + Math.round(line.getFloat('quantity') * line.getFloat('unit_cost') * 100), 0) / 100
        }
        return { date: day(record.getString('order_date')), currency: record.getString('currency'), subtotal, margin: cost === null ? null : Math.round((subtotal - cost) * 100) / 100 }
      })
      ordered = metric(rows, 'subtotal', 'Commandes clients confirmées, selon la date de commande. Montants HT historiques, commandes annulées exclues.')
      margin = metric(rows, 'margin', 'Marge prévisionnelle HT des commandes clients : montant HT moins coût snapshoté. Ce n’est pas une marge réalisée.', true, rows.filter((row) => row.margin === null).length)
    }
    if (rights.includes('purchasing.read')) {
      const rows = records(event.app, 'purchasing_orders', 'status != "draft" && status != "cancelled" && validated_at >= {:wideFrom} && validated_at < {:wideTo}', params).filter((record) => inPeriod(record.getString('validated_at'))).map((record) => ({ date: day(record.getString('validated_at')), currency: record.getString('currency'), amount: record.getFloat('subtotal') }))
      committed = metric(rows, 'amount', 'Achats engagés HT : commandes fournisseurs validées dans la période, annulations exclues.')
    }
    return event.json(200, { from, to, forecast, ordered, margin, committed })
  },
  tasks(event) {
    guard(event)
    const dates = require(`${__hooks}/lib/purchasing-common.js`), query = event.request.url.query(), from = dates.date(query.get('from'), true), to = dates.date(query.get('to'), true)
    if (from > to || Date.parse(to) - Date.parse(from) > 31 * 86400000) throw new BadRequestError('Période des tâches invalide.')
    const service = require(`${__hooks}/lib/activity.js`), items = []
    for (const [module, entities] of Object.entries(sources)) {
      if (!service.allowed(event.app, event.auth, false, module)) continue
      for (const [entity, prefix] of Object.entries(entities)) {
        const tasks = event.app.findRecordsByFilter('core_tasks', 'source_module = {:module} && source_entity = {:entity} && assigned_to = {:user} && status != "done" && status != "cancelled" && due_date >= {:from} && due_date <= {:to}', 'due_date,id', 6, 0, { module, entity, user: event.auth.id, from, to: `${to} 23:59:59.999Z` })
        for (const task of tasks) {
          let root
          try { root = service.source(event.app, entity, task.getString('source_record_id')) } catch { continue }
          items.push({ id: task.id, title: task.getString('title'), due_date: task.getString('due_date'), source: sourceLabel(root), href: prefix + root.id })
        }
      }
    }
    return event.json(200, { items: items.sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id)).slice(0, 6) })
  },
  activity(event) {
    guard(event)
    const service = require(`${__hooks}/lib/activity.js`)

    const permitted = Object.entries(sources).filter(([module]) => service.allowed(event.app, event.auth, false, module))
    if (!permitted.length) return event.json(200, { items: [] })
    const clauses = [], params = {}
    for (const [module, entities] of permitted) for (const [entity] of Object.entries(entities)) { const n = clauses.length; clauses.push(`(source_module = {:module${n}} && source_entity = {:entity${n}})`); params[`module${n}`] = module; params[`entity${n}`] = entity }
    const items = []
    // Paginate past orphan events so deleted sources neither leak nor hide valid activity.
    for (let offset = 0; items.length < 6; offset += 50) {
      const rows = event.app.findRecordsByFilter('core_activity_events', clauses.join(' || '), '-created,-id', 50, offset, params)
      for (const record of rows) {
        let root
        try { root = service.source(event.app, record.getString('source_entity'), record.getString('source_record_id')) } catch { continue }
        const entity = record.getString('source_entity'), module = record.getString('source_module')
        const label = sourceLabel(root)
        items.push({ id: record.id, type: record.getString('type'), body: record.getString('body').slice(0, 240), author: service.author(event.app, record.getString('author')).name, created: record.getString('created'), source: label, href: sources[module][entity] + root.id })
        if (items.length === 6) break
      }
      if (rows.length < 50) break
    }
    return event.json(200, { items })
  },
}
