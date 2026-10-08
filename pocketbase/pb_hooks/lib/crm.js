const fields = ['title', 'company', 'contact', 'owner', 'stage', 'estimated_value', 'estimated_cost', 'currency', 'probability', 'expected_date', 'description', 'description_content', 'market_types', 'status', 'type']
const labels = { type: 'Type d’opportunité', title: 'Titre', company: 'Société', contact: 'Contact', owner: 'Responsable', stage: 'Étape commerciale', estimated_value: 'Montant estimé', estimated_cost: 'Coût estimé', currency: 'Devise', probability: 'Probabilité', expected_date: 'Échéance', description: 'Description', description_content: 'Mise en forme de la description', market_types: 'Types de marché', status: 'État', active: 'Statut' }
const states = { open: 'Ouverte', won: 'Gagnée', completed: 'Terminée', lost: 'Perdue', cancelled: 'Annulée' }
const authorize = (event, write = true) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, write, 'crm')) throw new ForbiddenError('Accès CRM refusé.')
}
const get = (app, id) => { if (typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Opportunité invalide.'); try { return app.findRecordById('crm_opportunities', id) } catch { throw new ApiError(404, 'Opportunité introuvable.') } }
const display = (app, key, value) => {
  if (key === 'market_types') return (value || []).map((id) => { try { return app.findRecordById('crm_market_types', id).getString('label') } catch { return 'Ancienne référence' } }).join(', ') || '—'
  if (['company', 'contact', 'owner', 'stage'].includes(key) && value) {
    const collection = { company: 'contacts_companies', contact: 'contacts_people', owner: 'core_users', stage: 'crm_stages' }[key]
    try { const item = app.findRecordById(collection, value); return key === 'contact' ? `${item.getString('first_name')} ${item.getString('last_name')}`.trim() : item.getString(key === 'stage' ? 'label' : 'name') } catch { return 'Ancienne référence' }
  }
  if (key === 'description_content') return value ? 'Texte mis en forme' : 'Texte simple'
  return key === 'status' ? states[value] : key === 'active' ? value ? 'Actif' : 'Archivé' : String(value ?? '')
}
const audit = (app, record, before, actor, action) => {
  const saved = record.publicExport()
  const entry = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor, module: 'crm', entity: 'crm_opportunities', entity_id: record.id, action, before, after: action === 'delete' ? null : saved, metadata: { source: 'server' } })) entry.set(key, value)
  app.save(entry)
  if (action === 'delete') return
  const changes = [...fields, 'active'].filter((key) => before && JSON.stringify(before[key]) !== JSON.stringify(saved[key])).map((key) => ({ field: key, label: labels[key], before: display(app, key, before[key]), after: display(app, key, saved[key]) }))
  require(`${__hooks}/lib/activity.js`).publish(app, record, actor, ['archive', 'restore'].includes(action) ? 'status_change' : 'change', action === 'create' ? 'Fiche créée' : '', { action, changes })
}
const validate = (app, input, before) => {
  if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some((key) => !fields.includes(key))) throw new BadRequestError('Champs CRM invalides.')
  for (const key of ['title', 'company', 'contact', 'owner', 'stage', 'currency', 'expected_date', 'description', 'status']) if (typeof input[key] !== 'string') throw new BadRequestError('Champs CRM incomplets.')
  input.type = input.type || 'direct'
  if (!['direct', 'tender'].includes(input.type)) throw new BadRequestError('Type d’opportunité invalide.')
  input.market_types = input.market_types || []
  if (!Array.isArray(input.market_types) || input.market_types.length > 50 || new Set(input.market_types).size !== input.market_types.length || input.market_types.some((id) => typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id))) throw new BadRequestError('Types de marché invalides.')
  for (const id of input.market_types) {
    let market
    try { market = app.findRecordById('crm_market_types', id) } catch { throw new BadRequestError('Type de marché introuvable.') }
    if (!market.getBool('active') && (!before || !(before.market_types || []).includes(id))) throw new BadRequestError('Ce type de marché est inactif.')
  }
  input.description_content = input.description_content || null
  if (input.description_content) input.description = require(`${__hooks}/lib/rich-text.js`)(input.description_content)
  input.title = input.title.trim(); input.description = input.description.trim()
  if (!input.title || input.title.length > 160 || input.description.length > 10000 || !Object.hasOwn(states, input.status)) throw new BadRequestError('Titre ou état invalide.')
  for (const key of ['estimated_value', 'estimated_cost', 'probability']) if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < 0 || input[key] > (key === 'probability' ? 100 : 999999999999)) throw new BadRequestError('Montant ou probabilité invalide.')
  if (!Number.isInteger(input.probability)) throw new BadRequestError('Probabilité entière requise.')
  if (input.expected_date && (!/^\d{4}-\d{2}-\d{2}$/.test(input.expected_date) || !Number.isFinite(Date.parse(input.expected_date)) || new Date(input.expected_date).toISOString().slice(0, 10) !== input.expected_date)) throw new BadRequestError('Échéance invalide.')
  for (const [key, collection] of [['company', 'contacts_companies'], ['contact', 'contacts_people'], ['owner', 'core_users'], ['stage', 'crm_stages']]) {
    if (!input[key] && ['contact'].includes(key)) continue
    if (!/^[a-z0-9]{15}$/.test(input[key])) throw new BadRequestError('Référence invalide.')
    let referenced
    try { referenced = app.findRecordById(collection, input[key]) } catch { throw new BadRequestError('Référence introuvable.') }
    if (!referenced.getBool('active') && (!before || before[key] !== input[key])) throw new BadRequestError('Cette référence est archivée.')
    if (key === 'contact' && referenced.getString('company') !== input.company) throw new BadRequestError('Le contact doit appartenir à la société choisie.')
    if (key === 'owner' && !require(`${__hooks}/lib/activity.js`).allowed(app, referenced, false, 'crm') && (!before || before.owner !== input.owner)) throw new BadRequestError('Ce responsable ne peut pas consulter le CRM.')
  }
  input.status = app.findRecordById('crm_stages', input.stage).getString('status')
  let currency
  try { currency = app.findFirstRecordByFilter('accounting_currencies', 'code = {:code}', { code: input.currency }) } catch { throw new BadRequestError('Devise inconnue.') }
  if (!currency.getBool('active') && (!before || before.currency !== input.currency)) throw new BadRequestError('Devise inactive.')
  return input
}
const create = (app, input, actor, key) => {
  validate(app, input, null)
  const code = require(`${__hooks}/lib/numbering-service.js`)(app, 'crm_opportunities')
  const account = require(`${__hooks}/lib/analytic-service.js`).create(app, code, input.title, input.company)
  const record = new Record(app.findCollectionByNameOrId('crm_opportunities'))
  for (const [name, value] of Object.entries({ opportunity_number: code, analytic_account: account.id, active: true, creation_key: key, creation_actor: actor })) record.set(name, value)
  for (const name of fields) record.set(name, name === 'expected_date' && input[name] ? `${input[name]} 00:00:00.000Z` : input[name])
  record.set('estimated_margin', input.estimated_value - input.estimated_cost)
  app.save(record)
  require(`${__hooks}/lib/analytic-service.js`).attach(app, account, record.id)
  return record
}
module.exports = {
  validate, create, audit, fields,
  owners(event) {
    authorize(event, false)
    const users = event.app.findRecordsByFilter('core_users', 'active = true && role.active = true && role.permissions ~ {:permission}', 'name,id', 200, 0, { permission: '"crm.read"' })
    return event.json(200, { items: users.map((user) => ({ id: user.id, name: user.getString('name') || 'Utilisateur Horizon' })) })
  },
  save(event) {
    authorize(event)
    const body = event.requestInfo().body
    if (!body.id && body.input?.type === 'tender') return require(`${__hooks}/lib/tender-cases.js`).save(event)
    let result
    event.app.runInTransaction((app) => {
      let record = body.id ? get(app, body.id) : null
      const before = record ? record.publicExport() : null
      if (record && !record.getBool('active')) throw new BadRequestError('Cette opportunité est archivée.')
      validate(app, body.input, before)
      if (record && body.updated !== record.getString('updated')) throw new ApiError(409, 'La fiche a été modifiée par un autre utilisateur. Rechargez-la avant de réessayer.')
      if (!record) {
        if (typeof body.creation_key !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.creation_key)) throw new BadRequestError('Clé de création manquante.')
        const previous = app.findRecordsByFilter('crm_opportunities', 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
        if (previous) {
          if (previous.getString('creation_actor') !== event.auth.id) throw new ForbiddenError('Clé de création déjà utilisée.')
          const stable = (value) => JSON.stringify(value, (key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]])) : item)
          const same = fields.every((key) => key === 'expected_date' ? previous.getString(key).slice(0, 10) === body.input[key] : key === 'description_content' ? stable(JSON.parse(previous.getString(key) || 'null')) === stable(body.input[key]) : JSON.stringify(previous.publicExport()[key]) === JSON.stringify(body.input[key]))
          if (!same) throw new ApiError(409, 'Cette création a déjà été enregistrée. Rechargez le répertoire pour retrouver la fiche.')
          const tender = require(`${__hooks}/lib/tenders.js`)
          if (body.input.type === 'tender' && !tender.same(app, previous, body.tender)) throw new ApiError(409, 'Les données AO de cette création ont changé.')
          result = previous.publicExport(); if (body.input.type === 'tender') result.tender = tender.find(app, previous.id).publicExport(); return
        }
        record = create(app, body.input, event.auth.id, body.creation_key)
      } else {
        for (const key of fields) record.set(key, key === 'expected_date' && body.input[key] ? `${body.input[key]} 00:00:00.000Z` : body.input[key])
        record.set('estimated_margin', body.input.estimated_value - body.input.estimated_cost)
        app.save(record)
        require(`${__hooks}/lib/analytic-service.js`).sync(app, record.getString('analytic_account'), record)
      }
      let tender
      if (body.input.type === 'tender') tender = require(`${__hooks}/lib/tenders.js`).save(app, record, body.tender, event.auth.id, body.tender_updated)
      else {
        if (body.tender) throw new BadRequestError('Une opportunité directe ne modifie pas le dossier AO.')
        const dossiers = require(`${__hooks}/lib/tenders.js`)
        tender = before?.type === 'tender' ? dossiers.archive(app, record, event.auth.id, body.tender_updated) : dossiers.find(app, record.id)
      }
      audit(app, record, before, event.auth.id, before ? 'update' : 'create')
      result = record.publicExport(); if (tender) result.tender = tender.publicExport()
    })
    return event.json(200, result)
  },
  move(event) {
    authorize(event)
    const changes = event.requestInfo().body.changes
    if (!Array.isArray(changes) || !changes.length || changes.length > 100 || new Set(changes.map((change) => change.id)).size !== changes.length) throw new BadRequestError('Déplacements invalides.')
    event.app.runInTransaction((app) => {
      for (const change of changes) {
        const record = get(app, change.id)
        if (!record.getBool('active')) throw new BadRequestError('Cette opportunité ne peut pas être déplacée.')
        if (record.getString('updated') !== change.updated) throw new ApiError(409, 'Une opportunité a changé. Rechargez le Kanban avant de réessayer.')
        const stage = app.findRecordById('crm_stages', String(change.stage))
        if (!stage.getBool('active')) throw new BadRequestError('Étape inactive.')
        const before = record.publicExport(); record.set('stage', stage.id); record.set('status', stage.getString('status')); app.save(record); audit(app, record, before, event.auth.id, 'update')
      }
    })
    return event.json(200, { success: true })
  },
  archive(event) {
    authorize(event); const body = event.requestInfo().body
    if (typeof body.active !== 'boolean') throw new BadRequestError('Statut invalide.')
    event.app.runInTransaction((app) => { const record = get(app, body.id); const before = record.publicExport(); record.set('active', body.active); app.save(record); const tender = require(`${__hooks}/lib/tenders.js`).find(app, record.id); if (tender && record.getString('type') === 'tender') { tender.set('active', body.active); app.save(tender) }; audit(app, record, before, event.auth.id, body.active ? 'restore' : 'archive') })
    return event.json(200, { success: true })
  },
  remove(event) {
    authorize(event)
    event.app.runInTransaction((app) => {
      const record = get(app, event.requestInfo().body.id)
      // Accounting history is structural: CRM never purges an affair or its account.
      throw new ApiError(409, `L’affaire ${record.getString('opportunity_number')} possède un compte analytique. Utilisez l’archivage pour conserver sa traçabilité.`)
    })
  },
}
