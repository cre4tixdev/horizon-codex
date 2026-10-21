const policy = require(`${__hooks}/lib/access-policy.js`), common = require(`${__hooks}/lib/messaging-common.js`)
const pricing = require(`${__hooks}/lib/pricing.js`)
const fields = ['product', 'product_supplier', 'price_source', 'margin_percent', 'kind', 'brand', 'reference', 'unit_cost', 'discount', 'is_option', 'show_total', 'description', 'quantity', 'unit', 'unit_price']
const lineInput = (line) => Object.fromEntries(fields.map((field) => [field, line[field]]))
const guard = (app, user, write = false) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'sales') || write && !policy.settings(app, user)) throw new ForbiddenError('Accès aux modèles de devis refusé.')
}
const dto = (record, detail = true) => ({ id: record.id, label: record.getString('label'), description: record.getString('description'), active: record.getBool('active'), currency: record.getString('currency'), updated: record.getString('updated'), ...(detail ? { content: JSON.parse(record.getString('content')) } : {}) })
const get = (app, user, id) => {
  const record = common.get(app, 'sales_quote_templates', id)
  if (!record.getBool('active') && !policy.settings(app, user)) throw new ApiError(404, 'Modèle indisponible.')
  return record
}
const validate = (input) => {
  common.exact(input, ['label', 'description', 'currency', 'content'])
  if (typeof input.label !== 'string' || !input.label.trim() || input.label.length > 120 || typeof input.description !== 'string' || input.description.length > 1000 || !['EUR', 'USD', 'GBP', 'CAD', 'CHF'].includes(input.currency)) throw new BadRequestError('Nom, description ou devise du modèle invalide.')
  const content = input.content
  common.exact(content, ['title', 'notes', 'validity_days', 'terms_id', 'discount', 'discount_mode', 'lines'])
  if (typeof content.title !== 'string' || content.title.length > 200 || typeof content.notes !== 'string' || content.notes.length > 10000 || typeof content.terms_id !== 'string' || content.terms_id.length > 100 || !Number.isInteger(content.validity_days) || content.validity_days < 1 || content.validity_days > 365 || !Array.isArray(content.lines) || !content.lines.length) throw new BadRequestError('Renseignez le contenu et la validité du modèle.')
  for (const line of content.lines) common.exact(line, fields)
  const result = pricing.quoteLines(content.lines, content.discount, content.discount_mode)
  return { ...content, title: content.title.trim(), lines: result.lines.map(lineInput) }
}
module.exports = {
  list(e) {
    guard(e.app, e.auth)
    const q = e.requestInfo().query, page = Number(q.page || 1), state = q.state || 'active', search = String(q.q || '').trim()
    if (!['active', 'archived'].includes(state) || !Number.isInteger(page) || page < 1 || page > 100000 || search.length > 200) throw new BadRequestError('Recherche de modèles invalide.')
    if (state === 'archived') guard(e.app, e.auth, true)
    const filter = 'active = {:active}' + (search ? ' && (label ~ {:q} || description ~ {:q})' : ''), params = { active: state === 'active', q: search }
    const condition = $dbx.hashExp({ active: state === 'active' })
    const totalItems = e.app.countRecords('sales_quote_templates', search ? $dbx.and(condition, $dbx.or($dbx.like('label', search), $dbx.like('description', search))) : condition)
    const items = e.app.findRecordsByFilter('sales_quote_templates', filter, 'label,id', 25, (page - 1) * 25, params).map((record) => dto(record, false))
    return e.json(200, { items, page, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / 25)) })
  },
  read(e) { guard(e.app, e.auth); return e.json(200, dto(get(e.app, e.auth, e.request.pathValue('id')))) },
  save(e) {
    guard(e.app, e.auth, true)
    const b = e.requestInfo().body
    common.exact(b, ['id', 'updated', 'creation_key', 'input'])
    const content = validate(b.input)
    if (!b.id && (typeof b.creation_key !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(b.creation_key))) throw new BadRequestError('Clé de création du modèle invalide.')
    let saved
    e.app.runInTransaction((app) => {
      guard(app, e.auth, true)
      if (!b.id) {
        const existing = app.findRecordsByFilter('sales_quote_templates', 'created_by = {:user} && creation_key = {:key}', '', 1, 0, { user: e.auth.id, key: b.creation_key })[0]
        if (existing) { saved = dto(existing); return }
      }
      const record = b.id ? get(app, e.auth, b.id) : new Record(app.findCollectionByNameOrId('sales_quote_templates'))
      if (b.id && record.getString('updated') !== b.updated) throw new ApiError(409, 'Le modèle a changé. Rechargez-le.')
      const before = b.id ? record.publicExport() : null
      if (!b.id) { record.set('created_by', e.auth.id); record.set('creation_key', b.creation_key); record.set('active', true) }
      for (const key of ['label', 'description', 'currency']) record.set(key, b.input[key].trim())
      record.set('content', content); app.save(record)
      policy.audit(app, 'sales_quote_templates', record.id, e.auth.id, before, record.publicExport(), b.id ? 'update' : 'create'); saved = dto(record)
    })
    return e.json(200, saved)
  },
  state(e) {
    guard(e.app, e.auth, true); const b = e.requestInfo().body; common.exact(b, ['id', 'updated', 'active'])
    if (typeof b.active !== 'boolean') throw new BadRequestError('État du modèle invalide.')
    let saved
    e.app.runInTransaction((app) => {
      guard(app, e.auth, true); const record = get(app, e.auth, b.id)
      if (record.getString('updated') !== b.updated) throw new ApiError(409, 'Le modèle a changé. Rechargez-le.')
      const before = record.publicExport(); record.set('active', b.active); app.save(record)
      policy.audit(app, 'sales_quote_templates', record.id, e.auth.id, before, record.publicExport(), b.active ? 'restore' : 'archive'); saved = dto(record)
    }); return e.json(200, saved)
  },
  preview(e) {
    guard(e.app, e.auth)
    const activity = require(`${__hooks}/lib/activity.js`)
    if (!activity.allowed(e.app, e.auth, true, 'sales') || !activity.allowed(e.app, e.auth, false, 'crm') || !require(`${__hooks}/lib/catalog.js`).allowed(e.app, e.auth)) throw new ForbiddenError('Droits Ventes, CRM et catalogue nécessaires pour utiliser un modèle.')
    const b = e.requestInfo().body; common.exact(b, ['id', 'opportunity', 'quote_date', 'token'])
    const record = get(e.app, e.auth, b.id)
    if (!record.getBool('active')) throw new BadRequestError('Ce modèle est archivé.')
    const opp = common.get(e.app, 'crm_opportunities', b.opportunity)
    if (!opp.getBool('active') || !opp.getString('analytic_account')) throw new BadRequestError('Choisissez une opportunité active avec un compte analytique.')
    if (opp.getString('currency') !== record.getString('currency')) throw new BadRequestError('Le modèle et l’opportunité doivent utiliser la même devise.')
    if (typeof b.quote_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.quote_date) || !Number.isFinite(Date.parse(b.quote_date)) || new Date(b.quote_date).toISOString().slice(0, 10) !== b.quote_date) throw new BadRequestError('Date du devis invalide.')
    const content = JSON.parse(record.getString('content')), issues = [], sources = new Map()
    const lines = content.lines.map((line, index) => {
      if (!line.product) return line
      const sourceKey = JSON.stringify([line.product, line.unit])
      if (!sources.has(sourceKey)) sources.set(sourceKey, require(`${__hooks}/lib/catalog-quote-cost.js`)(e.app, e.auth, record.getString('currency'), line))
      const price = sources.get(sourceKey)
      if (!price.available || line.price_source === 'margin' && price.unit_cost <= 0) { issues.push({ line: index + 1, message: price.reason || 'Coût nul incompatible avec la règle de marge.' }); return line }
      return { ...line, product_supplier: price.product_supplier, unit_cost: price.unit_cost, cost_refresh: price.token }
    })
    let termsLabel = '', termsVersion = ''
    if (content.terms_id) {
      const settings = e.app.findFirstRecordByData('settings_sales', 'key', 'default')
      const terms = JSON.parse(settings.getString('terms') || '[]')
      termsLabel = terms.find((term) => term.id === content.terms_id)?.label || ''
      termsVersion = settings.getString('updated')
      if (!terms.some((term) => term.id === content.terms_id && term.active)) issues.push({ line: 0, message: 'Les conditions de vente du modèle sont archivées ou indisponibles.' })
    }
    const result = pricing.quoteLines(lines, content.discount, content.discount_mode)
    const valid = new Date(b.quote_date); valid.setUTCDate(valid.getUTCDate() + content.validity_days)
    const input = { title: content.title, notes: content.notes, discount: content.discount, discount_mode: content.discount_mode, terms_id: content.terms_id, valid_until: valid.toISOString().slice(0, 10), lines: result.lines.map((line, index) => ({ ...lineInput(line), ...(lines[index].cost_refresh ? { cost_refresh: lines[index].cost_refresh } : {}) })) }
    const token = $security.sha256(JSON.stringify([record.getString('updated'), opp.id, opp.getString('updated'), b.quote_date, input, issues, termsVersion]))
    if (b.token !== undefined && b.token !== token) throw new ApiError(409, 'Le modèle ou les tarifs ont changé. Vérifiez à nouveau l’aperçu.')
    return e.json(200, { template: dto(record, false), input, token, issues, terms_label: termsLabel, subtotal: result.subtotal, options_total: result.options_total })
  },
}
