// Read one authorized business source without expanding the polymorphic collection rule.
const moduleFor = (entity) => entity === 'documents_files' ? 'documents' : entity === 'time_sheets' ? 'time' : entity === 'leave_requests' ? 'leave' : entity === 'expenses_reports' ? 'expenses' : entity.startsWith('billing_') ? 'billing' : entity.startsWith('purchasing_') ? 'purchasing' : entity.startsWith('inventory_') ? 'inventory' : entity.startsWith('sales_') ? 'sales' : entity.startsWith('crm_') ? 'crm' : 'contacts'
const readSource = (event, entity, id, expectedModule) => {
  const activity = require(`${__hooks}/lib/activity.js`), module = moduleFor(entity)
  if (expectedModule !== undefined && expectedModule !== module || !activity.allowed(event.app, event.auth, false, module)) throw new ForbiddenError('Accès au fil refusé.')
  if (entity === 'documents_files') return require(`${__hooks}/lib/ged-common.js`).read(event, id)
  const source = activity.source(event.app, entity, id)
  activity.authorizeSource(event.app, event.auth, source)
  // Catalogue, Stock and Purchasing expose their private collections through
  // module services. Their activity policy is module.read + an existing source.
  const privateSources = ['documents_files', 'inventory_products', 'inventory_operations', 'inventory_internal_assets', 'purchasing_requests', 'purchasing_orders', 'billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes']
  if (!privateSources.includes(entity) && !event.app.canAccessRecord(source, event.requestInfo(), source.collection().viewRule)) throw new ForbiddenError('Accès à la fiche refusé.')
  return source
}
const scope = (event) => {
  const query = event.requestInfo().query, entity = String(query.entity || ''), id = String(query.id || '')
  const source = readSource(event, entity, id), module = moduleFor(entity)
  const params = { entity, id, module }
  let filter = '(source_entity = {:entity} && source_record_id = {:id} && source_module = {:module})'
  if (entity === 'contacts_companies') {
    const identity = require(`${__hooks}/lib/company-identity.js`), authorized = identity.ids(event.app, id).filter((alias) => { try { readSource(event, entity, alias); return true } catch (error) { if (error.status !== 403 && error.status !== 404) throw error; return false } })
    filter = `(source_entity = {:entity} && ${identity.predicate('source_record_id', authorized, params)} && source_module = {:module})`
  }
  if (entity === 'crm_tenders' && source.getString('opportunity')) {
    const opportunity = require(`${__hooks}/lib/activity.js`).source(event.app, 'crm_opportunities', source.getString('opportunity'))
    if (event.app.canAccessRecord(opportunity, event.requestInfo(), opportunity.collection().viewRule)) {
      params.opportunity = opportunity.id
      filter += ' || (source_entity = "crm_opportunities" && source_record_id = {:opportunity} && source_module = "crm")'
    }
  }
  return { filter: `(${filter})`, params }
}
const eventDTO = (app, record) => {
  const value = record.publicExport(), metadata = JSON.parse(record.getString('metadata') || '{}')
  delete metadata.email // Always derive this projection; never trust stored client-shaped data.
  const email = metadata.email_id ? require(`${__hooks}/lib/messaging-activity.js`).summary(app, record) : null
  const reply = metadata.email_reply_id ? require(`${__hooks}/lib/messaging-activity.js`).reply(app, record) : null
  if (reply) metadata.author = { name: reply.name, initials: reply.name.trim().split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase() }
  return { id: record.id, collectionId: record.collection().id, type: value.type, author: value.author, body: reply ? reply.text || 'Réponse sans texte.' : email ? `${record.getString('source_entity') === 'sales_quotes' ? 'Devis envoyé' : 'Commande envoyée'} à ${email.to.join('; ')}` : value.body, created: value.created, attachments: value.attachments, metadata: { ...metadata, ...(reply ? { email: reply } : email ? { email } : {}) } }
}
module.exports = {
  readSource,
  eventDTO,
  authorizeRecord(event, record) { return readSource(event, record.getString('source_entity'), record.getString('source_record_id'), record.getString('source_module')) },
  events(event) {
    const { filter: source, params } = scope(event), query = event.requestInfo().query
    const category = String(query.category || 'all'), page = Number(query.page || 1)
    if (!['all', 'changes', 'comments', 'documents', 'tasks'].includes(category) || !Number.isInteger(page) || page < 1 || page > 1000000) throw new BadRequestError('Filtre ou page du fil invalide.')
    const predicates = {
      all: { filter: '', sql: '' },
      changes: { filter: ' && (type = "change" || type = "status_change")', sql: " AND type IN ('change', 'status_change')" },
      comments: { filter: ' && (type = "note" || type = "message")', sql: " AND type IN ('note', 'message')" },
      documents: { filter: ' && (attachments:length > 0 || ((metadata.email_id != "" || metadata.email_reply_id != "") && (source_entity = "sales_quotes" || source_entity = "purchasing_orders")))', sql: " AND (json_array_length(CASE WHEN json_valid(attachments) THEN attachments ELSE '[]' END) > 0 OR ((COALESCE(json_extract(metadata, '$.email_id'), '') != '' OR COALESCE(json_extract(metadata, '$.email_reply_id'), '') != '') AND source_entity IN ('sales_quotes','purchasing_orders')))" },
      tasks: { filter: ' && type = "task"', sql: " AND type = 'task'" },
    }
    const predicate = predicates[category], total = new DynamicModel({ total: 0 })
    event.app.db().newQuery(`SELECT COUNT(*) AS total FROM core_activity_events WHERE ${source.replaceAll('&&', 'AND').replaceAll('||', 'OR')}${predicate.sql}`).bind(params).one(total)
    const filter = source + predicate.filter
    const items = event.app.findRecordsByFilter('core_activity_events', filter, '-created,-id', 20, (page - 1) * 20, params)
    return event.json(200, { items: items.map((r) => eventDTO(event.app, r)), page, totalItems: total.total, totalPages: Math.ceil(total.total / 20) })
  },
  tasks(event) {
    const { filter, params } = scope(event)
    const records = event.app.findRecordsByFilter('core_tasks', filter, 'created,id', 10001, 0, params)
    if (records.length > 10000) throw new BadRequestError('Cette fiche comporte trop de tâches pour afficher le fil.')
    return event.json(200, { items: records.map((record) => {
      const value = record.publicExport()
      return { id: record.id, title: value.title, assigned_to: value.assigned_to, assigned_name: value.assigned_name, due_date: value.due_date, status: value.status, priority: value.priority, activity_event: value.activity_event }
    }) })
  },
}
