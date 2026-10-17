// Read-only federation: the owning module keeps the binary and its access policy.
const c = require(`${__hooks}/lib/ged-common.js`)
const activity = require(`${__hooks}/lib/activity-read.js`)
const tables = { invoice: 'billing_invoices', supplierinvoice: 'billing_supplier_invoices', credit: 'billing_credit_notes', suppliercredit: 'billing_supplier_credit_notes', expense: 'expenses_lines', leave: 'leave_requests' }
const classification = require(`${__hooks}/lib/ged-classification.js`), themeLabels = classification.labels
const digest = (name) => $security.sha256(name)
const idFor = (provider, id, name) => `linked-${provider}-${id}-${digest(name)}`
const clean = (name) => name.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1')
function context(e, source, cache) {
  const entity = source.collection().name, key = `${entity}:${source.id}`
  if (cache.has(key)) return cache.get(key)
  const links = [c.describe(e, entity, source.id)], seen = new Set([key])
  let incomplete = false
  // Optional historical context must not make an authorized binary disappear.
  // Querying zero rows is distinct from a failed query (which still propagates).
  const related = (table, id) => {
    const record = typeof id === 'string' && /^[a-z0-9]{15}$/.test(id) ? e.app.findRecordsByFilter(table, 'id = {:id}', '', 1, 0, { id })[0] : null
    if (!record) {
      incomplete = true
      console.warn('GED historical relation missing', { source_entity: entity, source_id: source.id, relation: table })
    }
    return record
  }
  const add = (entity, id) => {
    if (!id || seen.has(`${entity}:${id}`) || seen.size >= 100) return
    seen.add(`${entity}:${id}`)
    try {
      const r = activity.readSource(e, entity, id)
      links.push(c.describe(e, entity, id))
      if (r.getString('opportunity')) add('crm_opportunities', r.getString('opportunity'))
      if (r.getString('company')) add('contacts_companies', r.getString('company'))
    } catch (error) { if (!c.denied(error)) throw error }
  }
  add('crm_opportunities', source.getString('opportunity'))
  add('contacts_companies', source.getString('company') || source.getString('supplier'))
  add('sales_quotes', source.getString('sales_quote'))
  add('purchasing_orders', source.getString('purchase_order'))
  if (source.getString('source_order')) {
    const order = related('sales_orders', source.getString('source_order'))
    if (order) add('sales_quotes', order.getString('quote'))
  }
  const addAccount = (account) => {
    if (account.getString('opportunity')) add('crm_opportunities', account.getString('opportunity'))
    else if (c.policy.permissions(e.app, e.auth).includes('crm.read')) for (const opportunity of e.app.findRecordsByFilter('crm_opportunities', 'analytic_account = {:id}', '', 100, 0, { id: account.id })) add('crm_opportunities', opportunity.id)
  }
  if (entity.startsWith('billing_')) {
    const parent = entity.replace(/^billing_/, '').replace(/s$/, ''), lines = entity.replace(/s$/, '') + '_lines'
    const accounts = arrayOf(new DynamicModel({ id: '' }))
    e.app.db().newQuery(`SELECT DISTINCT json_extract(a.value, '$.analytic_account') AS id FROM ${lines} l, json_each(l.analytic_allocations) a WHERE l.${parent} = {:id} LIMIT 1001`).bind({ id: source.id }).all(accounts)
    if (accounts.length > 1000) throw new BadRequestError('Trop de comptes analytiques pour classer ce document.')
    for (const row of accounts) { const account = related('accounting_analytic_accounts', row.id); if (account) addAccount(account) }
    for (const id of JSON.parse(source.getString('source_orders') || '[]')) {
      if (entity.includes('supplier')) add('purchasing_orders', id)
      else { const order = related('sales_orders', id); if (order) add('sales_quotes', order.getString('quote')) }
    }
  }
  if (entity === 'purchasing_orders' || entity === 'purchasing_requests') {
    const isOrder = entity === 'purchasing_orders', table = isOrder ? 'purchasing_order_line_allocations' : 'purchasing_request_line_allocations'
    const allocations = e.app.findRecordsByFilter(table, isOrder ? 'order_line.order = {:id}' : 'request_line.request = {:id}', '', 1001, 0, { id: source.id })
    if (allocations.length > 1000) throw new BadRequestError('Trop de ventilations pour classer ces documents.')
    for (const allocation of allocations) {
      const account = related('accounting_analytic_accounts', allocation.getString('analytic_account'))
      if (account) addAccount(account)
    }
  }
  if (links.length >= 100) throw new BadRequestError('Trop de rattachements pour classer ces documents.')
  const value = { links, source, incomplete, space: links.some((l) => l.entity === 'crm_opportunities') ? 'affairs' : entity.startsWith('purchasing_') || entity.includes('supplier') ? 'suppliers' : entity.startsWith('sales_') || entity.startsWith('billing_') || entity.startsWith('contacts_') ? 'customers' : 'internal' }
  cache.set(key, value); return value
}
function resolve(e, provider, id, cache) {
  let record = c.get(e.app, provider === 'event' || provider === 'mail' ? 'core_activity_events' : tables[provider], id), source, names, label, author
  if (provider === 'event' || provider === 'mail') {
    // Core checks scopes (including HR), Messaging checks correlation and sent state.
    if (record.getString('source_entity') === 'documents_files') throw new ApiError(404, 'Source documentaire invalide.')
    const cached = cache.get(`${record.getString('source_entity')}:${record.getString('source_record_id')}`)
    source = cached && cached.links[0].module === record.getString('source_module') ? cached.source : activity.authorizeRecord(e, record)
    const email = provider === 'mail' ? require(`${__hooks}/lib/messaging-activity.js`).summary(e.app, record) || require(`${__hooks}/lib/messaging-activity.js`).reply(e.app, record) : null
    names = provider === 'event' ? Array.from(record.getStringSlice('attachments')) : email?.attachments || []
    label = provider === 'mail' ? email?.direction === 'received' ? 'Pièce reçue par e-mail' : 'Pièce envoyée par e-mail' : 'Pièce jointe à la fiche'
    author = record.getString('author')
  } else {
    const entity = provider === 'expense' ? 'expenses_reports' : tables[provider], sourceId = provider === 'expense' ? record.getString('report') : id
    source = cache.get(`${entity}:${sourceId}`)?.source || activity.readSource(e, entity, sourceId)
    names = Array.from(record.getStringSlice(provider === 'expense' ? 'receipt' : 'attachments'))
    label = provider === 'expense' ? 'Justificatif de dépense' : provider === 'leave' ? 'Justificatif de congé' : 'Pièce de facturation'
    author = source.getString('actor') || source.getString('user')
  }
  const base = context(e, source, cache), ctx = { ...base, links: [...base.links] }
  if (provider === 'expense') {
    for (const [entity, id] of [['crm_opportunities', record.getString('opportunity')], ['contacts_companies', record.getString('company')]]) if (id) {
      try { ctx.links.push(c.describe(e, entity, id)); if (entity === 'crm_opportunities') ctx.space = 'affairs' } catch (error) { if (!c.denied(error)) throw error }
    }
  }
  return { record, source, names, label, author, ...ctx, theme: classification.theme(source, provider === 'mail') }
}
function dto(e, provider, resolved, name) {
  const { record, source, label, author, space, links, theme, incomplete } = resolved, id = idFor(provider, record.id, name)
  const version = { id: digest(name), number: 1, filename: clean(name), size: 0, note: label, author: require(`${__hooks}/lib/activity.js`).author(e.app, author).name, created: record.getString('created') }
  return { id, name: clean(name), space, folder: '', folder_name: 'Pièces des fiches', category: '', category_name: themeLabels[theme], tags: [], description: '', visibility: 'team', readers: [], created_by: '', author: version.author, locked: true, archived_at: source.getString('archived_at') || (source.publicExport().active === false ? source.getString('updated') : ''), created: record.getString('created'), updated: record.getString('updated') || record.getString('created'), current: version, versions: [version], links, theme, origin: { label, ...(incomplete ? { warning: 'Un rattachement historique n’est plus disponible. Le document d’origine est conservé.' } : {}), source: { entity: source.collection().name, id: source.id } } }
}
module.exports = {
  list(e, scope) {
    const rows = [], cache = new Map(), rights = c.policy.permissions(e.app, e.auth), permitted = (module) => rights.includes(`${module}.read`)
    const providers = Object.entries(tables).filter(([, table]) => permitted(table.startsWith('billing_') ? 'billing' : table.startsWith('expenses_') ? 'expenses' : 'leave')).map(([provider, table]) => ({ provider, table, filter: `${provider === 'expense' ? 'receipt' : 'attachments'}:length > 0` }))
    if (['sales', 'purchasing', 'crm', 'contacts', 'inventory', 'billing', 'expenses', 'leave'].some(permitted)) providers.push({ provider: 'event', table: 'core_activity_events', filter: 'source_entity != "documents_files" && (attachments:length > 0 || metadata.email_id != "" || metadata.email_reply_id != "")' })
    for (const entry of providers) {
      const records = require(`${__hooks}/lib/ged-scope.js`).business(e, entry.table, scope, entry.filter.replace(/attachments:length > 0/g, "attachments != '[]' AND attachments != ''").replace(/receipt:length > 0/g, "receipt != '[]' AND receipt != ''").replace(/metadata.email_id/g, "json_extract(metadata, '$.email_id')").replace(/metadata.email_reply_id/g, "json_extract(metadata, '$.email_reply_id')").replace(/&&/g, 'AND').replace(/\|\|/g, 'OR'))
      if (records.length > 10000) throw new BadRequestError('Trop de pièces métier pour la bibliothèque. Contactez votre administrateur.')
      for (const record of records.filter((r) => entry.provider !== 'event' || /^[a-z0-9]{15}$/.test(r.getString('source_record_id')) && ['contacts_companies', 'contacts_people', 'crm_opportunities', 'crm_tenders', 'sales_quotes', 'purchasing_requests', 'purchasing_orders', 'inventory_products', 'inventory_operations', 'inventory_internal_assets', 'billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes', 'expenses_reports', 'leave_requests'].includes(r.getString('source_entity')) && permitted(r.getString('source_module')))) for (const provider of entry.provider === 'event' ? ['event', 'mail'] : [entry.provider]) {
        try {
          const r = resolve(e, provider, record.id, cache)
          for (const name of r.names) rows.push(dto(e, provider, r, name))
          if (rows.length > 10000) throw new BadRequestError('Trop de documents métier pour la bibliothèque.')
        } catch (error) { if (!c.denied(error)) throw error }
      }
    }
    return rows
  },
  read(e, id) {
    c.guard(e.app, e.auth)
    const match = /^linked-(event|mail|invoice|supplierinvoice|credit|suppliercredit|expense|leave)-([a-z0-9]{15})-([a-f0-9]{64})$/.exec(id)
    if (!match) throw new ApiError(404, 'Document métier introuvable.')
    const [, provider, recordId, hash] = match, resolved = resolve(e, provider, recordId, new Map()), name = resolved.names.find((name) => digest(name) === hash)
    if (!name) throw new ApiError(404, 'Pièce jointe introuvable.')
    return { dto: dto(e, provider, resolved, name), provider, record: resolved.record, name }
  },
  file(e, id, version) {
    const item = this.read(e, id)
    if (version !== item.dto.current.id) throw new ApiError(404, 'Version introuvable.')
    if (item.provider === 'mail') return require(`${__hooks}/lib/messaging-activity.js`).file(e, item.record, item.name)
    e.response.header().set('Cache-Control', 'no-store'); e.response.header().set('X-Content-Type-Options', 'nosniff')
    const fs = e.app.newFilesystem()
    try { return fs.serve(e.response, e.request, item.record.baseFilesPath() + '/' + item.name, item.dto.name) } finally { fs.close() }
  },
}
