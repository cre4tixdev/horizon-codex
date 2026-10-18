// One authorization policy for the workspace feed and its dashboard summary.
const sources = {
  documents_files: ['documents', '/documents/'],
  contacts_companies: ['contacts', '/contacts/companies/'], contacts_people: ['contacts', '/contacts/people/'],
  crm_opportunities: ['crm', '/crm/opportunities/'], crm_tenders: ['crm', '/crm/tenders/'],
  sales_quotes: ['sales', '/sales/quotes/'], purchasing_requests: ['purchasing', '/purchasing/requests/'], purchasing_orders: ['purchasing', '/purchasing/orders/'],
  inventory_products: ['inventory', '/inventory/products/'], inventory_operations: ['inventory', '/inventory/operations/'], inventory_internal_assets: ['inventory', '/inventory/assets/'],
  billing_invoices: ['billing', '/billing/customer/'], billing_supplier_invoices: ['billing', '/billing/supplier/'], billing_credit_notes: ['billing', '/billing/customer_credit/'], billing_supplier_credit_notes: ['billing', '/billing/supplier_credit/'],
  time_sheets: ['time', '/time-reporting/sheets/'], expenses_reports: ['expenses', '/expenses/'], leave_requests: ['leave', '/leave/'],
}
const categories = ['changes', 'comments', 'emails', 'documents', 'tasks', 'system']
const csv = (value, options) => {
  const values = String(value || '').split(',').filter(Boolean)
  if (values.some((v) => !options.includes(v))) throw new BadRequestError('Filtre d’activité invalide.')
  return [...new Set(values)]
}
const label = (record) => {
  const entity = record.collection().name
  if (entity === 'time_sheets') return `Temps BE · semaine du ${record.getString('week_start')}`
  if (entity === 'leave_requests') return `Congés · ${record.getString('start_date').slice(0, 10)} → ${record.getString('end_date').slice(0, 10)}`
  if (entity === 'expenses_reports') return `Note de frais · ${record.getString('month')}`
  const title = record.collection().name === 'contacts_people' ? [record.getString('first_name'), record.getString('last_name')].filter(Boolean).join(' ') : record.getString('title') || record.getString('name') || record.getString('employee_name')
  const code = ['opportunity_number', 'reference', 'quote_number', 'request_number', 'order_number', 'number', 'sku'].map((field) => record.getString(field)).find(Boolean)
  return [code, title].filter(Boolean).join(' · ') || 'Fiche liée'
}
const category = (item) => item.metadata.email ? 'emails' : ['change', 'status_change'].includes(item.type) ? 'changes' : ['note', 'message'].includes(item.type) ? 'comments' : item.type === 'task' ? 'tasks' : item.type === 'document' ? 'documents' : 'system'
function read(event, overview = false) {
  const activity = require(`${__hooks}/lib/activity.js`), reader = require(`${__hooks}/lib/activity-read.js`), q = overview ? { view: 'own' } : event.requestInfo().query
  const modules = [...new Set(Object.values(sources).map((v) => v[0]))], permitted = modules.filter((module) => activity.allowed(event.app, event.auth, false, module))
  if (!permitted.length) { if (overview) return { items: [] }; throw new ForbiddenError('Aucun module métier consultable.') }
  const selected = csv(q.module, modules), types = csv(q.type, categories), view = String(q.view || 'team'), period = String(q.period || (overview ? 'all' : '30')), sort = String(q.sort || '-created'), group = String(q.group || ''), page = Number(q.page || 1)
  if (!['team', 'own', 'mentions'].includes(view) || !['7', '30', '90', '365', 'all'].includes(period) || !['-created', 'created'].includes(sort) || !['', 'module', 'type', 'day'].includes(group) || !Number.isInteger(page) || page < 1 || page > 1000000 || String(q.q || '').length > 200) throw new BadRequestError('Critères d’activité invalides.')
  const params = {}, clauses = []
  for (const [entity, [module]] of Object.entries(sources)) if (permitted.includes(module) && (!selected.length || selected.includes(module))) {
    const n = clauses.length; clauses.push(`(source_module = {:module${n}} && source_entity = {:entity${n}})`); params[`module${n}`] = module; params[`entity${n}`] = entity
  }
  if (!clauses.length) return { items: [], totalItems: 0, totalPages: 0, page, groups: {} }
  let filter = `(${clauses.join(' || ')})`
  if (period !== 'all') { params.from = new Date(Date.now() - Number(period) * 86400000).toISOString().replace('T', ' '); filter += ' && created >= {:from}' }
  if (view === 'mentions') { params.user = event.auth.id; filter += ' && core_activity_mentions_via_event.user ?= {:user}' }
  const cache = new Map(), items = [], groups = {}, search = String(q.q || '').trim().toLocaleLowerCase('fr')
  let total = 0
  for (let offset = 0; ; offset += 100) {
    const rows = event.app.findRecordsByFilter('core_activity_events', filter, sort === 'created' ? 'created,id' : '-created,-id', 100, offset, params)
    if (offset + rows.length > 10000) throw new BadRequestError('Trop d’activité sur cette période. Choisissez une période plus courte.')
    for (const record of rows) {
      const entity = record.getString('source_entity'), id = record.getString('source_record_id'), key = `${entity}:${id}`
      if (!/^[a-z0-9]{15}$/.test(id)) continue // Ignore malformed legacy/orphan references.
      if (!cache.has(key)) {
        try { cache.set(key, reader.authorizeRecord(event, record)) }
        catch (error) { if (error.status !== 403 && error.status !== 404) throw error; cache.set(key, null) }
      }
      const source = cache.get(key)
      if (!source) continue
      const item = reader.eventDTO(event.app, record), kind = category(item)
      if (types.length && !types.includes(kind) && !(types.includes('documents') && (item.attachments.length || item.metadata.email?.attachments.length))) continue
      let task = null
      if (item.type === 'task') {
        const tasks = event.app.findRecordsByFilter('core_tasks', 'source_module = {:module} && source_entity = {:entity} && source_record_id = {:id} && (activity_event = {:event} || id = {:task})', '', 1, 0, { module: sources[entity][0], entity, id, event: item.id, task: item.metadata.task_id || '' })
        if (tasks.length) { const t = tasks[0].publicExport(); task = { id: t.id, title: t.title, assigned_to: t.assigned_to, assigned_name: t.assigned_name, due_date: t.due_date, status: t.status, priority: t.priority, activity_event: t.activity_event } }
      }
      if (view === 'own' && item.author !== event.auth.id && task?.assigned_to !== event.auth.id && !(Array.isArray(item.metadata.mentions) && item.metadata.mentions.some((mention) => mention?.id === event.auth.id))) continue
      const sourceLabel = label(source)
      if (search && ![sourceLabel, item.body, item.metadata.author.name, item.metadata.email?.subject, item.metadata.email?.from, ...(item.metadata.email?.to || []), ...item.attachments, task?.title].filter(Boolean).join(' ').toLocaleLowerCase('fr').includes(search)) continue
      const day = new DateTime(item.created).time().in(new Timezone('Europe/Paris')).format('2006-01-02')
      const groupKey = group === 'module' ? sources[entity][0] : group === 'type' ? kind : day
      groups[groupKey] = (groups[groupKey] || 0) + 1
      total++
      if (overview || total > (page - 1) * 20 && items.length < 20) items.push({ ...item, source: { entity, id }, module: sources[entity][0], sourceLabel, href: sources[entity][1] + id, category: kind, day, task })
      if (overview && items.length === 6) return { items }
    }
    if (rows.length < 100) break
  }
  return { items, totalItems: total, totalPages: Math.ceil(total / 20), page, groups }
}
module.exports = {
  describeSource(event, entity, id) {
    if (!sources[entity] || entity === 'documents_files') throw new BadRequestError('Source documentaire invalide.')
    const source = require(`${__hooks}/lib/activity-read.js`).readSource(event, entity, id, sources[entity][0])
    return { entity, id, module: sources[entity][0], label: label(source), href: sources[entity][1] + id, analytic_account: source.getString('analytic_account') }
  },
  feed(event) { return event.json(200, read(event)) },
  overview(event) { return event.json(200, { items: read(event, true).items.map((item) => ({ id: item.id, type: item.type, body: item.body.slice(0, 240), author: item.metadata.author.name, created: item.created, source: item.sourceLabel, href: item.href })) }) },
}
