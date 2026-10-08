const permissions = (app, user, write = false) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, write, 'sales')) throw new ForbiddenError('Accès aux devis refusé.')
}
const opportunity = (app, id, user, write = false) => {
  if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Choisissez une opportunité.')
  const record = app.findRecordById('crm_opportunities', id)
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'crm')) throw new ForbiddenError('Accès à l’opportunité refusé.')
  if (write && (!record.getBool('active') || !record.getString('analytic_account') || !record.getString('opportunity_number'))) throw new BadRequestError('Choisissez une opportunité active avec un code affaire.')
  return record
}
const get = (app, id) => app.findRecordById('sales_quotes', id)
const dto = (app, quote) => {
  const opp = app.findRecordById('crm_opportunities', quote.getString('opportunity'))
  const company = app.findRecordById('contacts_companies', quote.getString('company'))
  return { ...quote.publicExport(), opportunity_name: opp.getString('title'), opportunity_number: opp.getString('opportunity_number'), company_name: company.getString('name'), lines: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id }).map((record) => record.publicExport()) }
}
const audit = (app, record, before, actor, action, previousLines) => {
  const item = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor, module: 'sales', entity: 'sales_quotes', entity_id: record.id, action, before, after: record.publicExport(), metadata: { source: 'server', ...(previousLines ? { lines_before: previousLines, lines_after: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: record.id }).map((line) => line.publicExport()) } : {}) } })) item.set(key, value)
  app.save(item)
  const activity = require(`${__hooks}/lib/activity.js`)
  const fields = { title: 'Titre', status: 'État', subtotal: 'Total HT', discount: 'Remise globale', discount_mode: 'Mode de remise', terms_label: 'Conditions générales de vente', discount_amount: 'Remise globale', cost_total: 'Total achats HT', margin_amount: 'Marge globale', margin_percent: 'Marge sur coût (%)', tax_rate: 'TVA (%)', tax: 'TVA', total: 'Total TTC', options_total: 'Total options HT', quote_date: 'Date du devis', valid_until: 'Validité', notes: 'Notes' }
  const after = record.publicExport()
  const display = (field, value) => {
    if (value === undefined || value === null || value === '') return ''
    if (field === 'discount_mode') return value === 'amount' ? 'Montant' : 'Pourcentage'
    if (field === 'status') return ({ draft: 'Brouillon', validated: 'Validé', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', cancelled: 'Annulé' })[value] || String(value)
    if (['quote_date', 'valid_until'].includes(field)) return String(value).slice(0, 10).split('-').reverse().join('/')
    if (['subtotal', 'options_total', 'tax', 'total', 'discount_amount', 'cost_total', 'margin_amount'].includes(field)) return `${Number(value).toFixed(2).replace('.', ',')} ${({ EUR: '€', USD: '$', GBP: '£', CAD: '$ CA', CHF: 'CHF' })[record.getString('currency')] || record.getString('currency')}`
    return String(value).slice(0, 500)
  }
  const changes = Object.entries(fields).filter(([key]) => JSON.stringify(before?.[key]) !== JSON.stringify(after[key]) && (before || after[key] !== '')).map(([field, label]) => ({ field, label, before: display(field, before?.[field]), after: display(field, after[field]) }))
  activity.publish(app, record, actor, action === 'cancel' ? 'status_change' : 'change', action === 'create' ? 'Fiche créée' : action === 'cancel' ? 'Devis annulé' : 'Lignes et informations du devis mises à jour', { action: action === 'cancel' ? 'update' : action, changes })
}
module.exports = {
  record(event) { permissions(event.app, event.auth); return event.json(200, dto(event.app, get(event.app, event.request.pathValue('id')))) },
  choices(event) {
    permissions(event.app, event.auth); opportunityAccess(event.app, event.auth)
    const selected = event.request.url.query().get('selected')
    if (selected) { const record = opportunity(event.app, selected, event.auth); return event.json(200, { id: record.id, number: record.getString('opportunity_number'), title: record.getString('title'), currency: record.getString('currency') }) }
    const query = String(event.request.url.query().get('q') || '').trim()
    if (query.length > 200) throw new BadRequestError('Recherche trop longue.')
    const items = event.app.findRecordsByFilter('crm_opportunities', 'active = true && (title ~ {:q} || opportunity_number ~ {:q} || company.name ~ {:q})', '-created', 50, 0, { q: query }).map((record) => ({ id: record.id, number: record.getString('opportunity_number'), title: record.getString('title'), currency: record.getString('currency') }))
    return event.json(200, { items })
  },
  list(event) {
    permissions(event.app, event.auth)
    const query = event.request.url.query(), conditions = [], parameters = {}
    const search = String(query.get('q') || '').trim()
    if (search.length > 200) throw new BadRequestError('Recherche trop longue.')
    if (query.get('opportunity')) { opportunity(event.app, query.get('opportunity'), event.auth); parameters.opportunity = query.get('opportunity'); conditions.push('opportunity = {:opportunity}') }
    if (query.get('company')) { if (!/^[a-z0-9]{15}$/.test(query.get('company'))) throw new BadRequestError('Société invalide.'); parameters.company = query.get('company'); conditions.push('company = {:company}') }
    const status = query.get('status') || ''
    if (status && !['active', 'draft', 'validated', 'sent', 'accepted', 'cancelled', 'rejected'].includes(status)) throw new BadRequestError('État invalide.')
    if (status === 'active') conditions.push('status != "cancelled" && status != "rejected"')
    else if (status) { conditions.push('status = {:status}'); parameters.status = status }
    if (search) { conditions.push('(quote_number ~ {:q} || title ~ {:q} || company.name ~ {:q} || opportunity.title ~ {:q})'); parameters.q = search }
    const page = Number(query.get('page') || 1)
    if (!Number.isSafeInteger(page) || page < 1) throw new BadRequestError('Page invalide.')
    const sort = ['-created', 'quote_number', '-quote_number', 'quote_date', '-subtotal'].includes(query.get('sort')) ? query.get('sort') : '-created'
    const filter = conditions.join(' && ') || 'id != ""'
    const all = event.app.findRecordsByFilter('sales_quotes', filter, `${sort},id`, 10001, 0, parameters)
    if (all.length > 10000) throw new BadRequestError('Affinez la recherche des devis.')
    return event.json(200, { items: all.slice((page - 1) * 100, page * 100).map((quote) => dto(event.app, quote)), totalItems: all.length, totalPages: Math.ceil(all.length / 100), page })
  },
  save(event) {
    permissions(event.app, event.auth, true)
    const body = event.requestInfo().body
    if (Object.keys(body).some((key) => !['id', 'updated', 'creation_key', 'input'].includes(key))) throw new BadRequestError('Champs non autorisés.')
    const input = body.input || {}
    if (Object.keys(input).some((key) => !['opportunity', 'title', 'quote_date', 'valid_until', 'notes', 'lines', 'discount', 'discount_mode', 'terms_id'].includes(key))) throw new BadRequestError('Champs du devis non autorisés.')
    const title = String(input.title || '').trim(), notes = String(input.notes || '')
    if (!title || title.length > 200 || notes.length > 10000) throw new BadRequestError('Titre obligatoire (200 caractères maximum).')
    for (const name of ['quote_date', 'valid_until']) if (input[name] && !/^\d{4}-\d{2}-\d{2}$/.test(input[name])) throw new BadRequestError('Date invalide.')
    if (input.quote_date && (!Number.isFinite(Date.parse(`${input.quote_date}T00:00:00Z`)) || new Date(`${input.quote_date}T00:00:00Z`).toISOString().slice(0, 10) !== input.quote_date)) throw new BadRequestError('Date du devis invalide.')
    if (!body.id && input.quote_date && !input.valid_until) { const date = new Date(`${input.quote_date}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + event.app.findFirstRecordByData('settings_sales', 'key', 'default').getInt('validity_days')); input.valid_until = date.toISOString().slice(0, 10) }
    if (!input.quote_date || input.valid_until && input.valid_until < input.quote_date) throw new BadRequestError('Vérifiez les dates du devis.')
    const priced = require(`${__hooks}/lib/pricing.js`).quoteLines(input.lines, input.discount === undefined ? 0 : input.discount, input.discount_mode === undefined ? 'percent' : input.discount_mode)
    let saved
    event.app.runInTransaction((app) => {
      permissions(app, event.auth, true)
      let quote, before = null, previousLines = []
      if (body.id) {
        quote = get(app, body.id); before = quote.publicExport(); previousLines = app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id }).map((line) => line.publicExport())
        if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
        if (quote.getString('status') !== 'draft') throw new BadRequestError('Seul un brouillon est modifiable.')
        if (quote.getString('opportunity') !== input.opportunity) throw new BadRequestError('Le rattachement du devis est immuable.')
        opportunity(app, input.opportunity, event.auth, true)
      } else {
        if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
        const existing = app.findRecordsByFilter('sales_quotes', 'creation_key = {:key} && created_by = {:actor}', '', 1, 0, { key: body.creation_key, actor: event.auth.id })
        if (existing.length) { if (existing[0].getString('opportunity') !== input.opportunity) throw new ApiError(409, 'Cette création est déjà rattachée.'); saved = dto(app, existing[0]); return }
        const opp = opportunity(app, input.opportunity, event.auth, true)
        const last = app.findRecordsByFilter('sales_quotes', 'opportunity = {:id}', '-quote_sequence', 1, 0, { id: opp.id })
        const sequence = last.length ? last[0].getInt('quote_sequence') + 1 : 1
        quote = new Record(app.findCollectionByNameOrId('sales_quotes'))
        for (const [key, value] of Object.entries({ opportunity: opp.id, quote_sequence: sequence, quote_number: `${opp.getString('opportunity_number')}-${sequence}`, analytic_account: opp.getString('analytic_account'), company: opp.getString('company'), contact: opp.getString('contact'), currency: opp.getString('currency'), owner: event.auth.id, created_by: event.auth.id, creation_key: body.creation_key, status: 'draft', revision: 1, exchange_rate: 0 })) quote.set(key, value)
      }
      const previousUnits = Object.create(null)
      for (const old of previousLines.filter((line) => line.kind === 'item')) previousUnits[old.unit] = (previousUnits[old.unit] || 0) + 1
      for (const line of priced.lines.filter((line) => line.kind === 'item' && line.unit)) {
        const units = app.findRecordsByFilter('inventory_units', 'code = {:code} && active = true', '', 1, 0, { code: line.unit })
        if (!units.length) { if (!previousUnits[line.unit]) throw new BadRequestError('Choisissez une unité active du référentiel.'); previousUnits[line.unit]-- }
      }
      const settings = app.findFirstRecordByData('settings_sales', 'key', 'default')
      const termsId = input.terms_id === undefined ? quote.getString('terms_id') : input.terms_id
      if (typeof termsId !== 'string' || termsId.length > 100) throw new BadRequestError('Conditions générales invalides.')
      if (termsId !== quote.getString('terms_id')) {
        const term = JSON.parse(settings.getString('terms') || '[]').find((item) => item.id === termsId && item.active)
        if (termsId && !term) throw new BadRequestError('Choisissez des conditions générales actives.')
        quote.set('terms_id', termsId); quote.set('terms_label', term?.label || ''); quote.set('terms_content', term?.content || '')
      }
      const rate = settings.getFloat('default_tax_rate')
      const taxes = require(`${__hooks}/lib/tax.js`).quote(priced.lines, rate)
      if (!Number.isSafeInteger(Math.round(priced.subtotal * 100) + Math.round(taxes.tax * 100))) throw new BadRequestError('Total TTC hors limites.')
      for (const [key, value] of Object.entries({ title, notes, quote_date: `${input.quote_date}T00:00:00.000Z`, valid_until: input.valid_until ? `${input.valid_until}T00:00:00.000Z` : '', discount: priced.discount, discount_mode: priced.discount_mode, discount_amount: priced.discount_amount, subtotal_before_discount: priced.subtotal_before_discount, margin_percent: priced.margin_percent, subtotal: priced.subtotal, options_total: priced.options_total, cost_total: priced.cost_total, margin_amount: priced.margin_amount, tax_rate: rate, tax: taxes.tax, total: (Math.round(priced.subtotal * 100) + Math.round(taxes.tax * 100)) / 100 })) quote.set(key, value)
      app.save(quote)
      for (const old of app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', '', 0, 0, { id: quote.id })) app.delete(old)
      for (const line of taxes.lines) { const record = new Record(app.findCollectionByNameOrId('sales_quote_lines')); record.set('quote', quote.id); for (const [key, value] of Object.entries(line)) record.set(key, value); app.save(record) }
      audit(app, quote, before, event.auth.id, before ? 'update' : 'create', previousLines)
      saved = dto(app, quote)
    })
    return event.json(200, saved)
  },
  cancel(event) {
    permissions(event.app, event.auth, true)
    const body = event.requestInfo().body, reason = String(body.reason || '').trim()
    if (!reason || reason.length > 2000) throw new BadRequestError('Indiquez le motif d’annulation.')
    let result
    event.app.runInTransaction((app) => { permissions(app, event.auth, true); const quote = get(app, body.id); if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié.'); if (quote.getString('status') !== 'draft') throw new BadRequestError('Seul un brouillon peut être annulé dans ce lot.'); const before = quote.publicExport(); quote.set('status', 'cancelled'); quote.set('lost_reason', reason); quote.set('cancelled_at', new Date().toISOString()); app.save(quote); audit(app, quote, before, event.auth.id, 'cancel'); result = dto(app, quote) })
    return event.json(200, result)
  },
  related(event) {
    permissions(event.app, event.auth)
    const opp = opportunity(event.app, event.request.pathValue('id'), event.auth)
    const quotes = event.app.findRecordsByFilter('sales_quotes', 'opportunity = {:id}', '', 10001, 0, { id: opp.id })
    const orders = event.app.findRecordsByFilter('sales_orders', 'opportunity = {:id} && status != "cancelled" && status != "draft"', '', 10001, 0, { id: opp.id })
    if (quotes.length > 10000 || orders.length > 10000) throw new BadRequestError('Trop de documents à consolider.')
    const totals = { [opp.getString('currency')]: 0 }, ordered = {}
    for (const order of orders) { const currency = order.getString('currency'), cents = Math.round(order.getFloat('subtotal') * 100); totals[currency] = (totals[currency] || 0) + cents; const key = `${order.getString('quote')}:${currency}`; ordered[key] = (ordered[key] || 0) + cents }
    for (const quote of quotes.filter((record) => !['cancelled', 'rejected'].includes(record.getString('status')))) { const currency = quote.getString('currency'); totals[currency] = (totals[currency] || 0) + Math.max(0, Math.round(quote.getFloat('subtotal') * 100) - (ordered[`${quote.id}:${currency}`] || 0)) }
    return event.json(200, { quoteCount: quotes.length, orderCount: orders.length, revenue: Object.entries(totals).map(([currency, cents]) => ({ currency, amount: cents / 100 })) })
  },
}
function opportunityAccess(app, user) { if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'crm')) throw new ForbiddenError('Accès CRM requis pour choisir une opportunité.') }
