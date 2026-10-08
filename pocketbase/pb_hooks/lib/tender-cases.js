// AO roots exist before a commercial affair. All decisions run inside the caller's transaction.
const common = ['title', 'company', 'contact', 'owner', 'market_types', 'estimated_value', 'estimated_cost', 'currency', 'probability', 'expected_date', 'description', 'description_content']
const authorize = (event, write = false) => { if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, write, 'crm')) throw new ForbiddenError('Accès CRM refusé.') }
const get = (app, id) => {
  if (typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Dossier AO invalide.')
  try { return app.findRecordById('crm_tenders', id) } catch { throw new ApiError(404, 'Dossier AO introuvable.') }
}
const linked = (app, tender) => tender.getString('opportunity') ? app.findRecordById('crm_opportunities', tender.getString('opportunity')) : null
const initialStage = (app) => app.findFirstRecordByFilter('crm_stages', 'code = "new" && active = true')
const input = (app, tender) => {
  const record = linked(app, tender) || tender
  const source = record.publicExport()
  return Object.fromEntries(require(`${__hooks}/lib/crm.js`).fields.map((key) => [key, key === 'type' ? 'tender' : key === 'stage' ? record.collection().name === 'crm_opportunities' ? source.stage : initialStage(app).id : key === 'status' ? record.collection().name === 'crm_opportunities' ? source.status : 'open' : key === 'expected_date' ? record.getString(key).slice(0, 10) : key === 'description_content' ? JSON.parse(record.getString(key) || 'null') : key === 'market_types' ? record.getStringSlice(key) : source[key]]))
}
const expand = (app, collection, id, keys) => { if (!id) return undefined; const record = app.findRecordById(collection, id); return Object.fromEntries(['id', 'collectionId', ...keys].map((key) => [key, record.publicExport()[key]])) }
const project = (app, tender) => {
  const opportunity = linked(app, tender)
  const values = input(app, tender)
  const visits = app.findRecordsByFilter('crm_tender_appointments', 'tender = {:id} && kind = "visit" && status != "cancelled"', 'start', 0, 0, { id: tender.id })
  const files = app.findRecordsByFilter('core_activity_events', '(source_entity = "crm_tenders" && source_record_id = {:id}) || (source_entity = "crm_opportunities" && source_record_id = {:opportunity})', '', 0, 0, { id: tender.id, opportunity: tender.getString('opportunity') }).reduce((count, record) => count + record.getStringSlice('attachments').length, 0)
  return { ...values, id: tender.id, collectionId: tender.collection().id, record_kind: 'tender', opportunity_number: opportunity?.getString('opportunity_number') || '', analytic_account: opportunity?.getString('analytic_account') || '', linked_updated: opportunity?.getString('updated') || '', estimated_margin: values.estimated_value - values.estimated_cost, active: tender.getBool('active') && !tender.getString('archived_at') && (!opportunity || opportunity.getString('type') === 'tender' && opportunity.getBool('active')), created: tender.getString('created'), updated: tender.getString('updated'), tender: tender.publicExport(), visit_count: visits.length, document_count: files, expand: { company: expand(app, 'contacts_companies', values.company, ['name', 'logo']), ...(values.contact ? { contact: expand(app, 'contacts_people', values.contact, ['first_name', 'last_name']) } : {}), owner: expand(app, 'core_users', values.owner, ['name']), stage: expand(app, 'crm_stages', values.stage, ['code', 'label', 'sort_order', 'tone', 'color', 'active', 'status']) } }
}
const decide = (app, tender, actor) => {
  const status = app.findRecordById('crm_tender_statuses', tender.getString('status'))
  if (['todo', 'no_go'].includes(status.getString('code')) || tender.getString('opportunity')) return
  const values = input(app, tender)
  values.stage = initialStage(app).id; values.status = 'open'
  const crm = require(`${__hooks}/lib/crm.js`)
  const opportunity = crm.create(app, values, actor, `tender-promotion-${tender.id}`)
  tender.set('opportunity', opportunity.id); app.save(tender)
  crm.audit(app, opportunity, null, actor, 'create')
  require(`${__hooks}/lib/tenders.js`).log(app, tender, tender, null, actor, 'update', `Décision de répondre · opportunité #${opportunity.getString('opportunity_number')} créée`)
}
const filters = (query) => {
  const parameters = { active: query.get('state') !== 'archived' }
  const clauses = ['archived_at = ""', '(opportunity = "" || opportunity.type = "tender")', parameters.active ? '(active = true && (opportunity = "" || opportunity.active = true))' : '(active = false || opportunity != "" && opportunity.active = false)']
  for (const key of ['company', 'owner']) if (query.get(key)) {
    if (!/^[a-z0-9]{15}$/.test(query.get(key))) throw new BadRequestError('Filtre AO invalide.')
    parameters[key] = query.get(key); clauses.push(`(opportunity = "" && ${key} = {:${key}} || opportunity != "" && opportunity.${key} = {:${key}})`)
  }
  for (const [key, field] of [['preparation_status', 'status'], ['tag', 'tags.id']]) if (query.get(key)) {
    if (!/^[a-z0-9]{15}$/.test(query.get(key))) throw new BadRequestError('Filtre AO invalide.')
    parameters[key] = query.get(key); clauses.push(`${field} ${key === 'tag' ? '?=' : '='} {:${key}}`)
  }
  const search = String(query.get('q') || '').trim()
  if (search.length > 200) throw new BadRequestError('Recherche trop longue.')
  search.split(/\s+/).filter(Boolean).forEach((term, index) => { parameters[`q${index}`] = term; clauses.push(`(reference ~ {:q${index}} || opportunity = "" && (title ~ {:q${index}} || company.name ~ {:q${index}}) || opportunity != "" && (opportunity.title ~ {:q${index}} || opportunity.opportunity_number ~ {:q${index}} || opportunity.company.name ~ {:q${index}}))`) })
  if (query.get('status')) { if (!['open', 'won', 'completed', 'lost', 'cancelled'].includes(query.get('status'))) throw new BadRequestError('État invalide.'); parameters.status = query.get('status'); clauses.push('(opportunity != "" && opportunity.status = {:status})') }
  return { filter: clauses.join(' && '), parameters }
}
module.exports = {
  get, linked, project, decide, filters,
  record(event) { authorize(event); return event.json(200, project(event.app, get(event.app, event.request.pathValue('id')))) },
  list(event) {
    authorize(event)
    const query = event.request.url.query(), { filter, parameters } = filters(query)
    const requestedPage = Number(query.get('page') || 1)
    if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) throw new BadRequestError('Page AO invalide.')
    const page = requestedPage
    const allowed = ['created', 'reference', 'title', 'publication_date', 'submission_deadline', 'estimated_value']
    const requested = query.get('sort') || '-created'
    const sort = allowed.includes(requested.replace(/^-/, '')) ? requested : '-created'
    const matches = event.app.findRecordsByFilter('crm_tenders', filter, '', 10001, 0, parameters)
    const totalItems = matches.length
    if (totalItems > 10000) throw new BadRequestError('Affinez les filtres de la liste AO.')
    const field = sort.replace(/^-/, ''), direction = sort.startsWith('-') ? -1 : 1
    const ordered = matches.map((record) => { const source = ['title', 'estimated_value'].includes(field) ? linked(event.app, record) || record : record; return { record, value: field === 'estimated_value' ? source.getFloat(field) : source.getString(field) } }).sort((a, b) => direction * (typeof a.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))) || a.record.id.localeCompare(b.record.id))
    const items = ordered.slice((page - 1) * 100, page * 100).map(({ record }) => project(event.app, record))
    return event.json(200, { items, totalItems, totalPages: Math.ceil(totalItems / 100), page })
  },
  summary(event) {
    authorize(event); const { filter, parameters } = filters(event.request.url.query())
    const records = event.app.findRecordsByFilter('crm_tenders', filter, '', 10001, 0, parameters)
    if (records.length > 10000) throw new BadRequestError('Affinez les filtres pour calculer les totaux AO.')
    const totals = {}
    for (const tender of records) { const record = linked(event.app, tender) || tender; const currency = record.getString('currency'), stage = tender.getString('status'), key = `${stage}:${currency}`; totals[key] ||= { stage, currency, count: 0, amount: 0 }; totals[key].count++; totals[key].amount += record.getFloat('estimated_value') }
    return event.json(200, { items: Object.values(totals) })
  },
  save(event) {
    authorize(event, true); const body = event.requestInfo().body; let result
    if (!body.input || typeof body.input !== 'object' || Array.isArray(body.input) || body.input.type && body.input.type !== 'tender') throw new BadRequestError('Données du dossier AO invalides.')
    event.app.runInTransaction((app) => {
      let tender = body.id ? get(app, body.id) : null
      const before = tender?.publicExport() || null
      if (tender && (!tender.getBool('active') || tender.getString('archived_at'))) throw new BadRequestError('Ce dossier AO est archivé.')
      if (tender && body.updated !== tender.getString('updated')) throw new ApiError(409, 'Le dossier AO a changé. Rechargez la fiche.')
      const opportunity = tender ? linked(app, tender) : null
      if (opportunity && (!opportunity.getBool('active') || opportunity.getString('type') !== 'tender')) throw new BadRequestError('Cette affaire est archivée ou convertie en directe.')
      if (opportunity && body.linked_updated !== opportunity.getString('updated')) throw new ApiError(409, 'L’opportunité liée a changé. Rechargez la fiche.')
      let values = { ...JSON.parse(JSON.stringify(body.input)), type: 'tender' }
      if (!opportunity) { values.stage = initialStage(app).id; values.status = 'open' }
      const crm = require(`${__hooks}/lib/crm.js`), dossiers = require(`${__hooks}/lib/tenders.js`)
      values = JSON.parse(JSON.stringify(crm.validate(app, values, opportunity?.publicExport() || (tender ? input(app, tender) : null))))
      const parsed = dossiers.validateInput(app, body.tender, before)
      if (!tender) {
        if (typeof body.creation_key !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.creation_key)) throw new BadRequestError('Clé de création manquante.')
        const previous = app.findRecordsByFilter('crm_tenders', 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
        if (previous) {
          if (previous.getString('creation_actor') !== event.auth.id) throw new ForbiddenError('Clé de création déjà utilisée.')
          const snapshot = { ...JSON.parse(JSON.stringify(previous.publicExport())), description_content: JSON.parse(previous.getString('description_content') || 'null') }
          const stable = (value) => JSON.stringify(value, (key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]])) : item)
          const normalize = (key, value) => ['publication_date', 'submission_deadline', 'expected_result_date'].includes(key) ? value ? new Date(value).toISOString() : '' : key === 'expected_date' ? (value || '').slice(0, 10) : key === 'description_content' ? value == null ? null : value : value
          const mismatches = Object.entries({ ...Object.fromEntries(common.map((key) => [key, values[key]])), ...parsed }).filter(([key, value]) => stable(normalize(key, snapshot[key])) !== stable(normalize(key, value))).map(([key]) => key)
          if (mismatches.length) throw new ApiError(409, `Cette création existe avec d’autres données (${mismatches.join(', ')}).`)
          result = project(app, previous); return
        }
        tender = new Record(app.findCollectionByNameOrId('crm_tenders')); tender.set('active', true); tender.set('creation_key', body.creation_key); tender.set('creation_actor', event.auth.id)
      }
      if (opportunity) {
        const old = opportunity.publicExport()
        for (const key of crm.fields) opportunity.set(key, key === 'expected_date' && values[key] ? `${values[key]} 00:00:00.000Z` : values[key])
        opportunity.set('estimated_margin', values.estimated_value - values.estimated_cost); app.save(opportunity)
        require(`${__hooks}/lib/analytic-service.js`).sync(app, opportunity.getString('analytic_account'), opportunity)
        crm.audit(app, opportunity, old, event.auth.id, 'update')
      } else for (const key of common) tender.set(key, key === 'expected_date' && values[key] ? `${values[key]} 00:00:00.000Z` : values[key])
      for (const [key, value] of Object.entries(parsed)) tender.set(key, value)
      app.save(tender); decide(app, tender, event.auth.id)
      dossiers.log(app, tender, tender, before, event.auth.id, before ? 'update' : 'create', before ? 'Dossier AO mis à jour' : 'Dossier AO créé')
      result = project(app, tender)
    })
    return event.json(200, result)
  },
  archive(event) {
    authorize(event, true); const body = event.requestInfo().body
    if (typeof body.active !== 'boolean') throw new BadRequestError('Archivage invalide.')
    event.app.runInTransaction((app) => {
      const tender = get(app, body.id), before = tender.publicExport()
      if (tender.getString('archived_at')) throw new BadRequestError('Réactivez ce dossier depuis le type de l’opportunité liée.')
      if (tender.getString('updated') !== body.updated) throw new ApiError(409, 'Le dossier AO a changé.')
      const opportunity = linked(app, tender)
      if (opportunity) { const old = opportunity.publicExport(); opportunity.set('active', body.active); app.save(opportunity); require(`${__hooks}/lib/crm.js`).audit(app, opportunity, old, event.auth.id, body.active ? 'restore' : 'archive') }
      tender.set('active', body.active); app.save(tender)
      require(`${__hooks}/lib/tenders.js`).log(app, tender, tender, before, event.auth.id, body.active ? 'restore' : 'archive', body.active ? 'Dossier AO réactivé' : 'Dossier AO archivé')
    })
    return event.json(200, { success: true })
  },
}
