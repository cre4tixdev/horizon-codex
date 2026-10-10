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
  const order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '-order_sequence,created', 1, 0, { id: quote.id })[0]
  const proof = order?.getString('customer_order_event') ? app.findRecordById('core_activity_events', order.getString('customer_order_event')) : null
  return { ...quote.publicExport(), can_delete: !quote.getString('sent_at') && quote.getString('status') !== 'sent' && !app.findRecordsByFilter('sales_orders', 'quote = {:id}', '', 1, 0, { id: quote.id }).length, owner_name: app.findRecordById('core_users', quote.getString('owner')).getString('name'), order: order ? { id: order.id, number: order.getString('order_number'), customer_number: order.getString('customer_order_number'), event_id: proof?.id || '', files: proof?.getStringSlice('attachments') || [] } : null, opportunity_name: opp.getString('title'), opportunity_number: opp.getString('opportunity_number'), company_name: company.getString('name'), lines: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id }).map((record) => record.publicExport()) }
}
const audit = (app, record, before, actor, action, previousLines) => {
  const item = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor, module: 'sales', entity: 'sales_quotes', entity_id: record.id, action, before, after: record.publicExport(), metadata: { source: 'server', ...(previousLines ? { lines_before: previousLines, lines_after: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: record.id }).map((line) => line.publicExport()) } : {}) } })) item.set(key, value)
  app.save(item)
  const activity = require(`${__hooks}/lib/activity.js`)
  const fields = { owner: 'Commercial', title: 'Titre', status: 'État', subtotal: 'Total HT', discount: 'Remise globale', discount_mode: 'Mode de remise', terms_label: 'Conditions générales de vente', discount_amount: 'Remise globale', cost_total: 'Total achats HT', margin_amount: 'Marge globale', margin_percent: 'Marge sur coût (%)', tax_rate: 'TVA (%)', tax: 'TVA', total: 'Total TTC', options_total: 'Total options HT', quote_date: 'Date du devis', valid_until: 'Validité', notes: 'Notes' }
  const after = record.publicExport()
  const display = (field, value) => {
    if (value === undefined || value === null || value === '') return ''
    if (field === 'owner') return value ? app.findRecordById('core_users', value).getString('name') : ''
    if (field === 'discount_mode') return value === 'amount' ? 'Montant' : 'Pourcentage'
    if (field === 'status') return ({ draft: 'Brouillon', validated: 'Devis', sent: 'Envoyé', accepted: 'Commande client', rejected: 'Refusé', cancelled: 'Annulé' })[value] || String(value)
    if (['quote_date', 'valid_until'].includes(field)) return String(value).slice(0, 10).split('-').reverse().join('/')
    if (['subtotal', 'options_total', 'tax', 'total', 'discount_amount', 'cost_total', 'margin_amount'].includes(field)) return `${Number(value).toFixed(2).replace('.', ',')} ${({ EUR: '€', USD: '$', GBP: '£', CAD: '$ CA', CHF: 'CHF' })[record.getString('currency')] || record.getString('currency')}`
    return String(value).slice(0, 500)
  }
  const changes = Object.entries(fields).filter(([key]) => JSON.stringify(before?.[key]) !== JSON.stringify(after[key]) && (before || after[key] !== '')).map(([field, label]) => ({ field, label, before: display(field, before?.[field]), after: display(field, after[field]) }))
  activity.publish(app, record, actor, action === 'cancel' ? 'status_change' : 'change', action === 'create' ? 'Fiche créée' : action === 'cancel' ? 'Devis annulé' : 'Lignes et informations du devis mises à jour', { action: action === 'cancel' ? 'update' : action, changes })
}
module.exports = {
  dto,
  summary(event) {
    permissions(event.app, event.auth)
    const query = event.requestInfo().query, conditions = ['archived_at = ""'], parameters = {}
    const search = String(query.q || '').trim()
    if (search.length > 200) throw new BadRequestError('Recherche trop longue.')
    if (query.opportunity) { opportunity(event.app, query.opportunity, event.auth); conditions.push('opportunity = {:opportunity}'); parameters.opportunity = query.opportunity }
    if (query.company) { if (!/^[a-z0-9]{15}$/.test(query.company)) throw new BadRequestError('Société invalide.'); conditions.push('company = {:company}'); parameters.company = query.company }
    if (search) { conditions.push('(quote_number LIKE {:q} OR title LIKE {:q} OR company IN (SELECT id FROM contacts_companies WHERE name LIKE {:q}) OR opportunity IN (SELECT id FROM crm_opportunities WHERE title LIKE {:q}))'); parameters.q = `%${search}%` }
    const rows = arrayOf(new DynamicModel({ status: '', count: 0 }))
    event.app.db().newQuery(`SELECT status, COUNT(*) AS count FROM sales_quotes WHERE ${conditions.join(' AND ')} GROUP BY status`).bind(parameters).all(rows)
    const result = { draft: 0, validated: 0, sent: 0, accepted: 0 }
    for (const row of rows) if (Object.prototype.hasOwnProperty.call(result, row.status)) result[row.status] = row.count
    return event.json(200, result)
  },
  salespeople(event) { permissions(event.app, event.auth); const activity = require(`${__hooks}/lib/activity.js`); return event.json(200, { items: event.app.findRecordsByFilter('core_users', 'active = true', 'name,id', 0, 0).filter((user) => activity.allowed(event.app, user, false, 'sales')).map((user) => ({ id: user.id, name: user.getString('name') })) }) },
  productQuotes(event) {
    permissions(event.app, event.auth)
    const catalog = require(`${__hooks}/lib/catalog.js`)
    if (!catalog.allowed(event.app, event.auth)) throw new ForbiddenError('Accès au produit refusé.')
    const id = event.request.pathValue('id'), page = Number(event.requestInfo().query.page || 1)
    if (!/^[a-z0-9]{15}$/.test(id || '') || !Number.isInteger(page) || page < 1 || page > 100000) throw new BadRequestError('Produit ou page invalide.')
    catalog.get(event.app, 'inventory_products', id)
    const lines = event.app.findRecordsByFilter('sales_quote_lines', 'product = {:id}', '-quote.quote_date,quote.id,position', 10001, 0, { id })
    if (lines.length > 10000) throw new BadRequestError('Historique trop volumineux. Contactez un administrateur.')
    const grouped = new Map()
    for (const line of lines) { const quote = line.getString('quote'); if (!grouped.has(quote)) grouped.set(quote, []); grouped.get(quote).push(line) }
    const activity = require(`${__hooks}/lib/activity.js`), crm = activity.allowed(event.app, event.auth, false, 'crm'), contacts = activity.allowed(event.app, event.auth, false, 'contacts')
    const items = [...grouped.entries()].slice((page - 1) * 25, page * 25).map(([id, rows]) => {
      const quote = get(event.app, id), analytic = crm ? event.app.findRecordById('accounting_analytic_accounts', quote.getString('analytic_account')) : null
      return { id, quote_number: quote.getString('quote_number'), title: quote.getString('title'), status: quote.getString('status'), quote_date: quote.getString('quote_date'), currency: quote.getString('currency'), company_name: contacts ? event.app.findRecordById('contacts_companies', quote.getString('company')).getString('name') : '', analytic_code: analytic?.getString('code') || '', analytic_label: analytic?.getString('label') || '', opportunity: crm ? quote.getString('opportunity') : '', quantity: rows.filter((row) => !row.getBool('is_option')).reduce((sum, row) => sum + row.getFloat('quantity'), 0), option_quantity: rows.filter((row) => row.getBool('is_option')).reduce((sum, row) => sum + row.getFloat('quantity'), 0), unit: rows[0].getString('unit'), subtotal: rows.filter((row) => !row.getBool('is_option')).reduce((sum, row) => sum + Math.round(row.getFloat('line_total') * 100), 0) / 100 }
    })
    return event.json(200, { items, totalItems: grouped.size, page, totalPages: Math.ceil(grouped.size / 25) })
  },
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
    if (status && !['active', 'archived', 'draft', 'validated', 'sent', 'accepted', 'cancelled', 'rejected'].includes(status)) throw new BadRequestError('État invalide.')
    conditions.push(status === 'archived' ? 'archived_at != ""' : 'archived_at = ""')
    if (status === 'active') conditions.push('status != "cancelled" && status != "rejected"')
    else if (status && status !== 'archived') { conditions.push('status = {:status}'); parameters.status = status }
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
    if (Object.keys(input).some((key) => !['opportunity', 'title', 'quote_date', 'valid_until', 'notes', 'lines', 'discount', 'discount_mode', 'terms_id', 'owner'].includes(key))) throw new BadRequestError('Champs du devis non autorisés.')
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
        if (quote.getString('status') !== 'draft' || quote.getString('archived_at')) throw new BadRequestError('Seul un brouillon actif est modifiable.')
        if (quote.getString('opportunity') !== input.opportunity) throw new BadRequestError('Le rattachement du devis est immuable.')
        opportunity(app, input.opportunity, event.auth, true)
      } else {
        if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
        const existing = app.findRecordsByFilter('sales_quotes', 'creation_key = {:key} && created_by = {:actor}', '', 1, 0, { key: body.creation_key, actor: event.auth.id })
        if (existing.length) { if (existing[0].getString('opportunity') !== input.opportunity) throw new ApiError(409, 'Cette création est déjà rattachée.'); saved = dto(app, existing[0]); return }
        const opp = opportunity(app, input.opportunity, event.auth, true)
        const last = app.findRecordsByFilter('sales_quotes', 'opportunity = {:id}', '-quote_sequence', 1, 0, { id: opp.id })
        const counter = app.findRecordsByFilter('sales_quote_counters', 'opportunity = {:id}', '', 1, 0, { id: opp.id })[0] || new Record(app.findCollectionByNameOrId('sales_quote_counters'))
        const sequence = Math.max(counter.getInt('last_value'), last[0]?.getInt('quote_sequence') || 0) + 1
        counter.set('opportunity', opp.id); counter.set('last_value', sequence); app.save(counter)
        quote = new Record(app.findCollectionByNameOrId('sales_quotes'))
        for (const [key, value] of Object.entries({ opportunity: opp.id, quote_sequence: sequence, quote_number: `${opp.getString('opportunity_number')}-${sequence}`, analytic_account: opp.getString('analytic_account'), company: opp.getString('company'), contact: opp.getString('contact'), currency: opp.getString('currency'), owner: event.auth.id, created_by: event.auth.id, creation_key: body.creation_key, status: 'draft', revision: 1, exchange_rate: 0 })) quote.set(key, value)
      }
      const owner = input.owner || quote.getString('owner')
      if (typeof owner !== 'string' || !/^[a-z0-9]{15}$/.test(owner)) throw new BadRequestError('Choisissez un commercial.')
      const salesperson = app.findRecordById('core_users', owner)
      if (owner !== quote.getString('owner') && !require(`${__hooks}/lib/activity.js`).allowed(app, salesperson, false, 'sales')) throw new BadRequestError('Choisissez un commercial actif habilité aux ventes.')
      quote.set('owner', owner)
      const catalog = require(`${__hooks}/lib/catalog.js`)
      const existingProducts = previousLines.filter((line) => line.product)
      for (const line of priced.lines.filter((line) => line.product)) {
        const previous = existingProducts.find((old) => old.product === line.product && old.product_supplier === line.product_supplier)
        if (previous) { if (line.unit !== previous.unit) throw new BadRequestError('Le produit utilise une autre unité de base.'); line.catalog_snapshot = previous.catalog_snapshot; continue }
        if (!catalog.allowed(app, event.auth)) throw new ForbiddenError('Accès au catalogue refusé.')
        const product = catalog.get(app, 'inventory_products', line.product)
        if (!product.getBool('active') || !product.getBool('sale_enabled')) throw new BadRequestError('Choisissez un produit actif pouvant être vendu.')
        if (product.getString('sale_currency') !== quote.getString('currency')) throw new BadRequestError('La devise du produit est différente de celle du devis.')
        const selection = catalog.productPrice(app, product, line.product_supplier || 'reference'); if (selection.warning) throw new BadRequestError(selection.warning)
        const supplier = line.product_supplier ? catalog.get(app, 'inventory_product_suppliers', line.product_supplier) : null
        if (supplier && (supplier.getString('product') !== product.id || !supplier.getBool('active'))) throw new BadRequestError('Tarif fournisseur invalide.')
        if (supplier && supplier.getString('currency') !== quote.getString('currency')) throw new BadRequestError('La devise du fournisseur est différente de celle du devis.')
        const unit = catalog.get(app, 'inventory_units', product.getString('base_unit'))
        if (unit.getString('code') !== line.unit) throw new BadRequestError('Le produit utilise une autre unité de base.')
        const category = catalog.get(app, 'inventory_product_categories', product.getString('category'))
        line.catalog_snapshot = { sku: product.getString('sku'), name: product.getString('name'), manufacturer: product.getString('manufacturer'), manufacturer_ref: product.getString('manufacturer_ref'), category: category.id, category_label: category.getString('label'), coefficient: product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : category.getFloat('coefficient'), coefficient_override: product.getBool('coefficient_override'), base_unit: unit.id, unit: unit.getString('code'), reference_cost: product.getFloat('reference_cost'), source: supplier ? 'supplier' : 'reference', supplier: supplier?.getString('supplier') || '', supplier_sku: supplier?.getString('supplier_sku') || '', list_price: supplier?.getFloat('list_price') || 0, supplier_discount: supplier?.getFloat('discount') || 0, purchase_quantity: supplier?.getFloat('purchase_quantity') || 1, currency: quote.getString('currency'), captured_at: new Date().toISOString() }
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
    event.app.runInTransaction((app) => { permissions(app, event.auth, true); const quote = get(app, body.id); if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié.'); if (!['draft', 'validated', 'sent'].includes(quote.getString('status')) || quote.getString('archived_at')) throw new BadRequestError('Revenez en devis ou réactivez la pièce avant de l’annuler.'); const before = quote.publicExport(); quote.set('status', 'cancelled'); quote.set('lost_reason', reason); quote.set('cancelled_at', new Date().toISOString()); app.save(quote); audit(app, quote, before, event.auth.id, 'cancel'); result = dto(app, quote) })
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
