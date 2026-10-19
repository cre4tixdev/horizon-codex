const b = require(`${__hooks}/lib/billing-common.js`)
const balances = require(`${__hooks}/lib/billing-balances.js`)
const snapshot = (app, kind, record, lines, depositPercent = record.getFloat('deposit_percent')) => {
  const settings = b.settings(app), company = b.get(app, 'contacts_companies', record.getString('company')), original = b.config(kind).credit ? b.json(b.get(app, b.config(b.config(kind).direction).collection, record.getString('source_invoice')), 'document_snapshot', {}) : null, party = original ? { fields: original.company, warnings: original.warnings || [] } : require(`${__hooks}/lib/contacts-document-context.js`)(app, company)
  const sourceCache = new Map()
  const costs = lines.filter((line) => line.kind === 'item').map((line) => {
    let unit_cost = null, basis = 'not_supplied'
    if (original) { const cost = original.costs?.find((item) => item.line_id === line.credit_source_line); unit_cost = cost?.unit_cost ?? null; basis = cost?.basis || basis }
    else if (b.config(kind).direction === 'supplier') { unit_cost = line.unit_price * (1 - line.discount / 100); basis = record.getString('invoice_kind') === 'deposit' ? 'supplier_advance' : 'supplier_invoice' }
    else if (line.source_line) {
      if (!sourceCache.has(line.source_order)) sourceCache.set(line.source_order, require(`${__hooks}/lib/sales-billing-source.js`)(app, line.source_order))
      unit_cost = sourceCache.get(line.source_order).costs.find((item) => item.line === line.source_line)?.unit_cost ?? null; basis = 'sales_quote_estimate'
    }
    return { line_id: line.id || line.line_key, unit_cost, basis, amount: unit_cost === null ? null : b.money(unit_cost * line.quantity * (record.getString('invoice_kind') === 'deposit' && depositPercent ? depositPercent / 100 : 1)), currency: 'EUR' }
  })
  return { deposit_presentation: depositPercent > 0 ? 2 : 0, kind, costs, origin: original ? { number: original.fields.number, supplier_reference: original.fields.supplier_invoice_number, date: original.fields.invoice_date } : null, sources: b.json(record, 'document_snapshot', {}).sources || [], issuer: b.json(settings, 'issuer', {}), company: party.fields, warnings: party.warnings, tax_codes: original?.tax_codes || b.json(settings, 'tax_codes'), fields: { ...record.publicExport(), deposit_percent: depositPercent }, layout: require(`${__hooks}/lib/billing-document.js`).layout(app, record), lines }
}
const dto = (app, kind, record, context, detail = true) => {
  const stored = b.json(record, 'document_snapshot', null), party = stored?.company || {}, company = party['company.name'] ? null : b.get(app, 'contacts_companies', record.getString('company'))
  const state = balances.project(app, kind, record, context || balances.context(app)), lines = detail ? b.rows(app, kind, record.id).map(b.lineDTO) : []
  const source = record.getString('source_invoice') || ''
  const presentation = record.getString('status') === 'draft' && detail ? require(`${__hooks}/lib/billing-deposit.js`).upgrade(app, kind, { invoice_kind: record.getString('invoice_kind'), deposit_percent: record.getFloat('deposit_percent'), title: record.getString('title'), lines }) : { title: record.getString('title'), deposit_percent: record.getFloat('deposit_percent'), lines }
  return { id: record.id, collectionId: record.collection().id, kind, label: b.config(kind).label, number: record.getString('number'), company: record.getString('company'), company_name: party['company.name'] || company?.getString('name') || '', customer_order_number: record.getString('customer_order_number').replace(/attente commande/gi, 'Attente Commande'), supplier_invoice_number: record.getString('supplier_invoice_number'), invoice_kind: record.getString('invoice_kind'), deposit_percent: presentation.deposit_percent, title: presentation.title, status: record.getString('status'), invoice_date: record.getString('invoice_date'), due_date: record.getString('due_date'), service_date: record.getString('service_date'), currency: record.getString('currency'), notes: record.getString('notes'), discrepancy_reason: record.getString('discrepancy_reason'), payment_term: record.getString('payment_term'), payment_terms: record.getString('payment_terms'), template_id: record.getString('template'), source_invoice: source, source_orders: b.json(record, 'source_orders'), source_operations: b.json(record, 'source_operations'), deduction_ids: b.config(kind).credit ? [] : b.json(record, 'deductions'), subtotal: record.getFloat('subtotal'), tax: record.getFloat('tax'), total: record.getFloat('total'), gross_subtotal: record.getFloat('gross_subtotal'), deposit_total: record.getFloat('deposit_total'), ...state, overdue: record.getString('status') === 'validated' && state.schedules.some((item) => item.balance > 0 && item.due_date < b.today()), archived_at: record.getString('archived_at'), updated: record.getString('updated'), created: record.getString('created'), lines: presentation.lines, sources: stored?.sources || [], attachments: record.getStringSlice('attachments'), issues: stored?.issues || [], schedules: state.schedules }
}
const inputFrom = (app, kind, record) => { const input = ({ company: record.getString('company'), template_id: record.getString('template'), invoice_kind: record.getString('invoice_kind'), deposit_percent: record.getFloat('deposit_percent'), customer_order_number: record.getString('customer_order_number').replace(/attente commande/gi, 'Attente Commande'), supplier_invoice_number: record.getString('supplier_invoice_number'), title: record.getString('title'), invoice_date: record.getString('invoice_date'), due_date: record.getString('due_date'), service_date: record.getString('service_date'), currency: record.getString('currency'), notes: record.getString('notes'), discrepancy_reason: record.getString('discrepancy_reason'), payment_term: record.getString('payment_term'), payment_terms: record.getString('payment_terms'), source_orders: b.json(record, 'source_orders'), source_operations: b.json(record, 'source_operations'), deduction_ids: b.config(kind).credit ? [] : b.json(record, 'deductions'), source_invoice: record.getString('source_invoice') || '', lines: b.rows(app, kind, record.id).map(b.lineDTO), schedules: app.findRecordsByFilter('billing_payment_schedules', 'document_type = {:kind} && document_id = {:id}', 'sequence', 0, 0, { kind, id: record.id }).map((item) => ({ due_date: item.getString('due_date'), amount: item.getFloat('amount') })) }); return record.getString('status') === 'draft' ? require(`${__hooks}/lib/billing-deposit.js`).upgrade(app, kind, input) : input }
const store = (app, user, kind, input, key, record) => {
  const normalized = require(`${__hooks}/lib/billing-normalize.js`)(app, user, kind, input, record), type = b.config(kind), before = record?.publicExport() || null
  const result = record || new Record(app.findCollectionByNameOrId(type.collection))
  if (!record) { result.set('creation_key', key); result.set('creation_hash', b.hash(input)); result.set('actor', user.id); result.set('status', 'draft') }
  for (const [field, value] of Object.entries(normalized.fields)) result.set(field, value)
  app.save(result)
  // Draft rows are replaced transactionally; source line IDs and public line keys remain explicit.
  for (const row of b.rows(app, kind, result.id)) app.delete(row)
  for (const line of normalized.lines) { const row = new Record(app.findCollectionByNameOrId(type.lines)); for (const [field, value] of Object.entries({ ...line, [type.parent]: result.id })) row.set(field, value); app.save(row) }
  for (const row of app.findRecordsByFilter('billing_payment_schedules', 'document_type = {:kind} && document_id = {:id}', '', 0, 0, { kind, id: result.id })) app.delete(row)
  const schedules = normalized.schedules.length ? normalized.schedules : type.credit ? [] : [{ sequence: 1, due_date: result.getString('due_date'), amount: result.getFloat('total') }]
  for (const item of schedules) { const row = new Record(app.findCollectionByNameOrId('billing_payment_schedules')); for (const [field, value] of Object.entries({ ...item, document_type: kind, document_id: result.id })) row.set(field, value); app.save(row) }
  result.set('document_snapshot', { issues: normalized.issues, sources: normalized.sources, ...(normalized.original_snapshot ? { company: normalized.original_snapshot.company, warnings: normalized.original_snapshot.warnings, tax_codes: normalized.original_snapshot.tax_codes } : {}) }); app.save(result)
  b.audit(app, user, result, before, record ? 'Facturation mise à jour' : 'Brouillon de facturation créé')
  return result
}
module.exports = {
  dto, inputFrom, store,
  calculate(event) {
    b.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body; b.exact(body, ['kind', 'id', 'updated', 'input'])
    const type = b.config(body.kind), record = body.id ? b.get(event.app, type.collection, body.id) : null
    if (record) { b.revision(record, body.updated); if (record.getString('status') !== 'draft' || record.getString('archived_at')) throw new BadRequestError('La pièce n’est plus modifiable.') }
    const normalized = require(`${__hooks}/lib/billing-normalize.js`)(event.app, event.auth, body.kind, body.input, record), fields = normalized.fields
    return event.json(200, { lines: normalized.lines.map(({ line_key, ...line }) => ({ ...line, key: line_key })), gross: fields.gross_subtotal, deductions: fields.deposit_total, subtotal: fields.subtotal, tax: fields.tax, total: fields.total })
  },
  record(event) { b.guard(event.app, event.auth); const kind = event.request.pathValue('kind'), record = b.get(event.app, b.config(kind).collection, event.request.pathValue('id')); return event.json(200, dto(event.app, kind, record)) },
  list(event) {
    const perPage = require(`${__hooks}/lib/list-page-size.js`)(event.requestInfo().query.perPage, 30)
    b.guard(event.app, event.auth); const query = event.requestInfo().query, kind = String(query.kind || 'customer'); b.config(kind)
    const context = balances.context(event.app), selectedKinds = kind === 'customer' || kind === 'supplier' ? [kind] : [kind]
    let rows = selectedKinds.flatMap((type) => [...context.documents].filter(([key]) => key.startsWith(`${type}/`)).map(([, record]) => dto(event.app, type, record, context, false)))
    const search = String(query.q || '').toLocaleLowerCase(), source = String(query.source_order || ''), companies = query.company ? new Set(require(`${__hooks}/lib/company-identity.js`).ids(event.app, query.company)) : null
    rows = rows.filter((row) => (!companies || companies.has(row.company)) && (!source || row.source_orders.includes(source)) && (!search || `${row.number} ${row.title} ${row.company_name} ${row.supplier_invoice_number}`.toLocaleLowerCase().includes(search)))
    const active = rows.filter((row) => !row.archived_at), summary = { draft: active.filter((row) => row.status === 'draft').length, validated: active.filter((row) => row.status === 'validated').length, unpaid: rows.filter((row) => row.balance > 0).length, overdue: rows.filter((row) => row.overdue).length }
    rows = rows.filter((row) => query.status === 'archived' ? row.archived_at : query.status === 'unpaid' ? row.balance > 0 : query.status === 'overdue' ? row.overdue : !row.archived_at && (!query.status || row.status === query.status))
    require(`${__hooks}/lib/list-sorting.js`).rows(rows, query.sort, ['created', 'invoice_date', 'due_date', 'number', 'company_name', 'total', 'balance', 'reference', 'status'], '-created', (item, field) => field === 'reference' ? item.supplier_invoice_number || item.title : field === 'status' ? (({ draft: 'Brouillon', validated: 'Validée', cancelled: 'Annulée' })[item.status] || item.status) + (item.overdue ? ' · En retard' : '') : item[field])
    const page = Math.max(1, Number(query.page) || 1), totalItems = rows.length
    return event.json(200, { items: rows.slice((page - 1) * perPage, page * perPage), summary, page, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / perPage)) })
  },
  save(event) {
    b.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body; b.exact(body, ['kind', 'id', 'updated', 'creation_key', 'input']); const type = b.config(body.kind); let result
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
    event.app.runInTransaction((app) => {
      b.guard(app, event.auth, 'write')
      const existing = body.id ? b.get(app, type.collection, body.id) : app.findRecordsByFilter(type.collection, 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
      if (existing && !body.id) { if (existing.getString('creation_hash') !== b.hash(body.input)) throw new ApiError(409, 'Cette création a déjà été utilisée avec un contenu différent.'); result = dto(app, body.kind, existing); return }
      if (existing) { b.revision(existing, body.updated); if (existing.getString('status') !== 'draft' || existing.getString('archived_at')) throw new BadRequestError('La pièce validée ou annulée est figée.') }
      result = dto(app, body.kind, store(app, event.auth, body.kind, body.input, body.creation_key, existing))
    }); return event.json(200, result)
  },
  prepare(event) {
    b.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body, prepared = require(`${__hooks}/lib/billing-sources.js`).prepare(event.app, event.auth, body)
    const normalized = require(`${__hooks}/lib/billing-normalize.js`)(event.app, event.auth, body.kind, { ...prepared, supplier_invoice_number: '', invoice_date: b.today(), due_date: b.today(), service_date: b.today(), currency: 'EUR', notes: '', discrepancy_reason: '', payment_terms: '', source_invoice: '', template_id: '', schedules: [] }, null)
    return event.json(200, { ...prepared, ...require(`${__hooks}/lib/payment-terms.js`).defaults(event.app, b.get(event.app, 'contacts_companies', prepared.company), b.today()), lines: normalized.lines.map(({ line_key, ...line }) => ({ ...line, key: line_key })) })
  },
  credit(event) {
    b.guard(event.app, event.auth, 'write'); const body = event.requestInfo().body; b.exact(body, ['kind', 'id']); const type = b.config(body.kind), original = b.get(event.app, type.collection, body.id)
    if (type.credit || original.getString('status') !== 'validated') throw new BadRequestError('Choisissez une facture validée.')
    const creditKind = `${type.direction}_credit`, credited = new Map(), parents = new Set(b.activeDocuments(event.app, creditKind).map((row) => row.id))
    for (const row of event.app.findAllRecords(b.config(creditKind).lines)) if (parents.has(row.getString(b.config(creditKind).parent))) credited.set(row.getString('credit_source_line'), (credited.get(row.getString('credit_source_line')) || 0) + row.getFloat('quantity'))
    const lines = b.rows(event.app, body.kind, original.id).filter((line) => line.getString('kind') === 'item').map(b.lineDTO).map((line) => ({ ...line, key: `credit-${line.id}`, credit_source_line: line.id, quantity: Math.max(0, line.quantity - (credited.get(line.id) || 0)) })).filter((line) => line.quantity > 0.000001)
    if (!lines.length) throw new BadRequestError('Toutes les quantités sont déjà créditées ou préparées.')
    return event.json(200, { ...inputFrom(event.app, body.kind, original), company: require(`${__hooks}/lib/company-identity.js`).resolve(event.app, original.getString('company')), source_invoice: original.id, company_name: dto(event.app, body.kind, original, null, false).company_name, supplier_invoice_number: '', title: `Avoir · ${original.getString('number')}`, lines, deduction_ids: [], schedules: [] })
  },
  transition(event) {
    b.guard(event.app, event.auth, 'invoice.validate'); const body = event.requestInfo().body; b.exact(body, ['kind', 'id', 'updated', 'action']); const type = b.config(body.kind); let result
    event.app.runInTransaction((app) => {
      b.guard(app, event.auth, 'invoice.validate'); let record = b.get(app, type.collection, body.id); b.revision(record, body.updated); const before = record.publicExport()
      if (body.action === 'validate') {
        if (record.getString('status') !== 'draft') throw new BadRequestError('Seul un brouillon se valide.')
        const input = inputFrom(app, body.kind, record), normalized = require(`${__hooks}/lib/billing-normalize.js`)(app, event.auth, body.kind, input, record)
        if (!normalized.lines.some((line) => line.kind === 'item') || normalized.fields.gross_subtotal <= 0) throw new BadRequestError('Renseignez au moins une ligne chiffrée positive.')
        if (record.getString('invoice_date') > b.today()) throw new BadRequestError('La date de validation ne peut être future.');
        if (!record.getString('service_date')) throw new BadRequestError('Renseignez la date de livraison ou de prestation.')
        if (type.direction === 'supplier' && (!record.getString('supplier_invoice_number') || !record.getStringSlice('attachments').length)) throw new BadRequestError('Renseignez le numéro fournisseur et joignez la pièce originale.')
        if (normalized.issues.length && !record.getString('discrepancy_reason')) throw new BadRequestError('Motivez les écarts de rapprochement avant validation.')
        const identity = snapshot(app, body.kind, record, normalized.lines)
        if (type.direction === 'customer' && (!identity.issuer.name || !identity.issuer.address || !identity.issuer.siret || !identity.issuer.late_payment_notice || !identity.issuer.recovery_notice || identity.warnings.length)) throw new BadRequestError('Complétez l’identité et les mentions de facturation dans Paramètres, ainsi que l’adresse principale du client.')
        record = store(app, event.auth, body.kind, input, record.getString('creation_key'), record)
        const last = app.findRecordsByFilter(type.collection, 'status = "validated"', '-invoice_date', 1, 0)[0]
        if (type.direction === 'customer' && last && record.getString('invoice_date') < last.getString('invoice_date')) throw new BadRequestError('La date ne peut précéder la dernière pièce numérotée de cette séquence.')
        record.set('number', require(`${__hooks}/lib/numbering-service.js`)(app, type.collection)); record.set('status', 'validated'); record.set('validated_by', event.auth.id); record.set('validated_at', new Date().toISOString())
        record.set('document_snapshot', snapshot(app, body.kind, record, b.rows(app, body.kind, record.id).map(b.lineDTO))); app.save(record)
      } else if (body.action === 'cancel') { if (record.getString('status') !== 'draft') throw new BadRequestError('Une facture validée se corrige par avoir.'); record.set('status', 'cancelled'); app.save(record) }
      else if (body.action === 'archive') { if (record.getString('status') === 'draft') throw new BadRequestError('Annulez d’abord le brouillon.'); record.set('archived_at', new Date().toISOString()); app.save(record) }
      else throw new BadRequestError('Action invalide.')
      b.audit(app, event.auth, record, before, body.action === 'validate' ? `${type.label} validé(e)` : body.action === 'archive' ? 'Pièce archivée' : 'Brouillon annulé')
      result = dto(app, body.kind, record)
    }); return event.json(200, result)
  },
  upload(event) {
    b.guard(event.app, event.auth, 'write'); const kind = event.request.pathValue('kind'), type = b.config(kind), id = event.request.pathValue('id'), files = event.findUploadedFiles('attachments'); if (!files.length || files.length > 5) throw new BadRequestError('Choisissez une à cinq pièces jointes.')
    let result; event.app.runInTransaction((app) => { const record = b.get(app, type.collection, id); b.revision(record, event.requestInfo().body.updated); if (record.getString('status') !== 'draft') throw new BadRequestError('Les pièces d’une facture validée sont figées.'); const before = record.publicExport(); record.set('attachments+', files); app.save(record); b.audit(app, event.auth, record, before, 'Pièce originale jointe'); result = dto(app, kind, record) }); return event.json(200, result)
  },
  payments(event) {
    const perPage = require(`${__hooks}/lib/list-page-size.js`)(event.requestInfo().query.perPage)
    b.guard(event.app, event.auth); const query = event.requestInfo().query, search = String(query.q || '').toLocaleLowerCase(), companies = query.company ? new Set(require(`${__hooks}/lib/company-identity.js`).ids(event.app, query.company)) : null, records = event.app.findRecordsByFilter('billing_payments', '', '-payment_date,-created', 0, 0).filter((record) => (!companies || companies.has(record.getString('company'))) && (!query.direction || record.getString('direction') === query.direction) && (!query.status || record.getString('status') === query.status))
    const rows = records.map((record) => ({ id: record.id, company: record.getString('company'), company_name: b.get(event.app, 'contacts_companies', record.getString('company')).getString('name'), direction: record.getString('direction'), payment_date: record.getString('payment_date'), currency: record.getString('currency'), amount: record.getFloat('amount'), method: record.getString('method'), reference: record.getString('reference'), status: record.getString('status'), allocations: b.json(record, 'allocations'), updated: record.getString('updated'), cancel_reason: record.getString('cancel_reason') })).filter((row) => !search || `${row.company_name} ${row.reference}`.toLocaleLowerCase().includes(search))
    const sort = query.sort === 'amount' ? '-paid_amount' : query.sort === 'payment_date' ? '-date' : query.sort
    require(`${__hooks}/lib/list-sorting.js`).rows(rows, sort, ['date', 'company_name', 'paid_amount', 'reference', 'method', 'direction', 'documents', 'status'], '-date', (item, field) => field === 'paid_amount' ? item.amount : field === 'date' ? item.payment_date : field === 'direction' ? item.direction === 'customer' ? 'Client' : 'Fournisseur' : field === 'documents' ? item.allocations.length : field === 'status' ? item.status === 'validated' ? 'Enregistré' : 'Annulé' : item[field])
    const page = Math.max(1, Number(query.page) || 1); return event.json(200, { items: rows.slice((page - 1) * perPage, page * perPage), page, totalItems: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / perPage)) })
  },
  pay(event) {
    b.guard(event.app, event.auth, 'payment.manage'); const body = event.requestInfo().body; b.exact(body, ['creation_key', 'payment_date', 'method', 'reference', 'allocations']); if (!/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '') || !Array.isArray(body.allocations) || !body.allocations.length || body.allocations.length > 100) throw new BadRequestError('Règlement invalide.')
    let output; event.app.runInTransaction((app) => {
      b.guard(app, event.auth, 'payment.manage'); const existing = app.findRecordsByFilter('billing_payments', 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
      if (existing) { if (existing.getString('creation_hash') !== b.hash(body)) throw new ApiError(409, 'Cette clé correspond déjà à un autre règlement.'); output = { id: existing.id }; return }
      const context = balances.context(app), seen = new Set(); let company = '', direction = '', credit = null, amount = 0
      const allocations = body.allocations.map((item) => { b.exact(item, ['kind', 'id', 'amount']); const type = b.config(item.kind), key = `${item.kind}/${item.id}`; if (seen.has(key)) throw new BadRequestError('Facture répétée.'); seen.add(key)
        const record = b.get(app, type.collection, item.id); if (record.getString('status') !== 'validated') throw new BadRequestError('Choisissez des pièces validées.')
        if (company && !require(`${__hooks}/lib/company-identity.js`).same(app, company, record.getString('company')) || direction && direction !== type.direction || credit !== null && credit !== type.credit) throw new BadRequestError('Un règlement couvre un même tiers, une même direction et un même sens de paiement.')
        company = require(`${__hooks}/lib/company-identity.js`).resolve(app, record.getString('company')); direction = type.direction; credit = type.credit
        const value = b.number(item.amount, 0.01), remaining = balances.project(app, item.kind, record, context).balance
        if (b.cents(value) > b.cents(remaining)) throw new ApiError(409, 'Le règlement dépasse le solde disponible.')
        context.paid.set(key, (context.paid.get(key) || 0) + b.cents(value)); if (type.credit) { const parent = context.credits.get(key); context.refunded.set(parent, (context.refunded.get(parent) || 0) + b.cents(value)) }
        amount += b.cents(value); return { kind: item.kind, id: item.id, amount: b.money(value) }
      })
      if (b.date(body.payment_date, true) > b.today()) throw new BadRequestError('Un règlement enregistré ne peut être daté dans le futur.');
      const payment = new Record(app.findCollectionByNameOrId('billing_payments')); for (const [field, value] of Object.entries({ company, direction, payment_date: b.date(body.payment_date, true), currency: 'EUR', amount: amount / 100, method: b.text(body.method, 40, true), reference: b.text(body.reference || '', 200), status: 'validated', allocations, actor: event.auth.id, creation_key: body.creation_key, creation_hash: b.hash(body) })) payment.set(field, value)
      app.save(payment); b.policy.audit(app, 'billing_payments', payment.id, event.auth.id, null, payment.publicExport(), 'create')
      for (const item of allocations) b.audit(app, event.auth, b.get(app, b.config(item.kind).collection, item.id), null, credit ? 'Remboursement enregistré' : 'Règlement enregistré')
      output = { id: payment.id }
    }); return event.json(200, output)
  },
  cancelPayment(event) {
    b.guard(event.app, event.auth, 'payment.manage'); const body = event.requestInfo().body; b.exact(body, ['id', 'updated', 'reason']); event.app.runInTransaction((app) => { const record = b.get(app, 'billing_payments', body.id); b.revision(record, body.updated); if (record.getString('status') !== 'validated') throw new BadRequestError('Ce règlement est déjà annulé.'); const context = balances.context(app); for (const item of b.json(record, 'allocations')) if (!b.config(item.kind).credit) { const key = `${item.kind}/${item.id}`, invoice = context.documents.get(key), paid = (context.paid.get(key) || 0) - b.cents(item.amount), credited = context.credited.get(key) || 0; if ((context.refunded.get(key) || 0) > Math.max(0, paid + credited - b.cents(invoice.getFloat('total')))) throw new ApiError(409, 'Annulez d’abord les remboursements liés à ce règlement.') }
      const before = record.publicExport(); record.set('status', 'cancelled'); record.set('cancel_reason', b.text(body.reason, 2000, true)); app.save(record); b.policy.audit(app, 'billing_payments', record.id, event.auth.id, before, record.publicExport(), 'update'); for (const item of b.json(record, 'allocations')) b.audit(app, event.auth, b.get(app, b.config(item.kind).collection, item.id), null, `Règlement annulé : ${record.getString('cancel_reason')}`) }); return event.json(200, { cancelled: true })
  },
  settings(event) { b.guard(event.app, event.auth); const record = b.settings(event.app); return event.json(200, { id: record.id, updated: record.getString('updated'), issuer: b.json(record, 'issuer', {}), tax_codes: b.json(record, 'tax_codes'), default_tax_code: record.getString('default_tax_code'), payment_days: record.getInt('payment_days'), payment_terms: record.getString('payment_terms'), payment_conditions: require(`${__hooks}/lib/payment-terms.js`).rows(event.app), default_payment_term: record.getString('default_payment_term') }) },
  saveSettings(event) {
    if (!b.policy.settings(event.app, event.auth)) throw new ForbiddenError('Paramétrage de facturation réservé aux administrateurs.'); const body = event.requestInfo().body; b.exact(body, ['id', 'updated', 'issuer', 'tax_codes', 'default_tax_code', 'payment_days', 'payment_terms', 'payment_conditions', 'default_payment_term'])
    const issuerKeys = ['name', 'address', 'postal_code', 'city', 'country', 'siret', 'vat_number', 'email', 'phone', 'iban', 'bic', 'legal_notice', 'late_payment_notice', 'discount_notice', 'recovery_notice']; b.exact(body.issuer, issuerKeys)
    const issuer = {}; for (const key of issuerKeys) issuer[key] = b.text(body.issuer[key] || '', key.endsWith('notice') ? 2000 : 300)
    if (!Array.isArray(body.tax_codes) || !body.tax_codes.length || body.tax_codes.length > 30) throw new BadRequestError('Configurez les codes TVA.'); const seen = new Set()
    const codes = body.tax_codes.map((item) => { b.exact(item, ['code', 'label', 'rate', 'mention']); const code = b.text(item.code, 40, true); if (!/^[A-Z0-9_-]+$/.test(code) || seen.has(code)) throw new BadRequestError('Code TVA invalide ou répété.'); seen.add(code); return { code, label: b.text(item.label, 120, true), rate: b.number(item.rate, 0, 100), mention: b.text(item.mention || '', 2000) } })
    if (!seen.has(body.default_tax_code)) throw new BadRequestError('Choisissez la TVA par défaut.')
    event.app.runInTransaction((app) => { const record = b.settings(app); b.revision(record, body.updated); const before = record.publicExport();
      for (const code of codes) if (Object.keys(b.types).some((kind) => { const type = b.config(kind); return app.findRecordsByFilter(type.lines, `tax_code = {:code} && tax_rate != {:rate} && ${type.parent}.status = "validated"`, '', 1, 0, { code: code.code, rate: code.rate }).length > 0 })) throw new BadRequestError('Un code TVA utilisé sur une pièce validée conserve son taux. Créez un nouveau code.');
      const term = require(`${__hooks}/lib/payment-terms.js`).save(app, event.auth, body.payment_conditions, body.default_payment_term); body.payment_days = term.getInt('days'); body.payment_terms = term.getString('description') || term.getString('label');
      if (!Number.isInteger(body.payment_days)) throw new BadRequestError('Le délai doit être un nombre entier de jours.'); for (const [field, value] of Object.entries({ default_payment_term: body.default_payment_term, issuer, tax_codes: codes, default_tax_code: body.default_tax_code, payment_days: b.number(body.payment_days, 0, 365), payment_terms: b.text(body.payment_terms || '', 2000) })) record.set(field, value); app.save(record); b.policy.audit(app, 'settings_billing', record.id, event.auth.id, before, record.publicExport(), 'update') }); return module.exports.settings(event)
  },
}
module.exports.choices = (event) => {
  b.guard(event.app, event.auth); const app = event.app, rights = b.policy.permissions(app, event.auth), companies = rights.includes('contacts.read') ? app.findRecordsByFilter('contacts_companies', 'active = true', 'name', 1000, 0).map((record) => ({ id: record.id, name: record.getString('name'), payment_term: record.getString('payment_term') })) : []
  const suppliers = new Set(rights.includes('contacts.read') ? app.findRecordsByFilter('contacts_company_roles', 'role = "supplier" && active = true', '', 0, 0).map((record) => record.getString('company')) : [])
  const settings = b.settings(app), sources = { customer: [], supplier: [] }, operations = { customer: [], supplier: [] }
  for (const direction of ['customer', 'supplier']) {
    if (!rights.includes(direction === 'customer' ? 'sales.read' : 'purchasing.read')) continue
    const records = direction === 'customer' ? app.findRecordsByFilter('sales_quotes', 'status = "accepted" && archived_at = ""', '-created', 500, 0) : app.findRecordsByFilter('purchasing_orders', 'status != "draft" && status != "cancelled" && archived_at = ""', '-created', 500, 0)
    for (const record of records) { const source = require(`${__hooks}/lib/billing-sources.js`).source(app, direction, record.id), name = b.get(app, 'contacts_companies', source.company).getString('name'); if (source.currency !== 'EUR') continue; sources[direction].push({ id: record.id, company: require(`${__hooks}/lib/company-identity.js`).resolve(app, source.company), name: `${source.number} · ${name}` })
      if (rights.includes('inventory.read')) for (const operation of require(`${__hooks}/lib/billing-sources.js`).operations(app, direction, record.id)) if (!operation.getBool('scrap') && !operation.getBool('internal_use')) operations[direction].push({ id: operation.id, company: require(`${__hooks}/lib/company-identity.js`).resolve(app, source.company), name: `${operation.getString('number')} · ${name}` })
    }
  }
  const analytic = app.findRecordsByFilter('accounting_analytic_accounts', rights.includes('crm.read') ? 'active = true' : 'active = true && fixed_key != ""', 'code', 1000, 0).map((record) => ({ id: record.id, name: `${record.getString('code')} · ${record.getString('label')}` }))
  const models = app.findRecordsByFilter('documents_templates', 'document_type = "invoice" && status != "archived" && current_version != ""', 'name', 100, 0).map((record) => ({ id: record.id, name: record.getString('name') }))
  return event.json(200, { companies, suppliers: companies.filter((company) => suppliers.has(company.id)), analytic, sources, operations, models, tax_codes: b.json(settings, 'tax_codes'), default_tax_code: settings.getString('default_tax_code'), payment_days: settings.getInt('payment_days'), payment_terms: settings.getString('payment_terms'), payment_conditions: require(`${__hooks}/lib/payment-terms.js`).rows(app), default_payment_term: settings.getString('default_payment_term') })
}
module.exports.dashboard = (event) => {
  b.guard(event.app, event.auth); const app = event.app, rights = b.policy.permissions(app, event.auth), context = balances.context(app), result = {}, month = b.today().slice(0, 7)
  for (const direction of ['customer', 'supplier']) {
    const records = [...context.documents].filter(([key]) => key.startsWith(`${direction}/`)).map(([, record]) => dto(app, direction, record, context, false)), active = records.filter((record) => !record.archived_at), validated = records.filter((record) => record.status === 'validated')
    let paymentsMonth = 0
    for (const payment of context.payments.filter((record) => record.getString('direction') === direction && record.getString('payment_date').startsWith(month))) for (const allocation of b.json(payment, 'allocations')) paymentsMonth += b.cents(allocation.amount) * (b.config(allocation.kind).credit ? -1 : 1)
    const canSources = rights.includes(direction === 'customer' ? 'sales.read' : 'purchasing.read'), pending = [], coverage = canSources ? require(`${__hooks}/lib/billing-sources.js`).coverage(app, direction) : new Map()
    if (canSources) {
      const orders = direction === 'customer' ? app.findRecordsByFilter('sales_quotes', 'status = "accepted" && archived_at = ""', '-created', 0, 0) : app.findRecordsByFilter('purchasing_orders', 'status != "draft" && status != "cancelled" && archived_at = ""', '-created', 0, 0)
      for (const order of orders) { const source = require(`${__hooks}/lib/billing-sources.js`).source(app, direction, order.id), received = direction === 'supplier' ? require(`${__hooks}/lib/billing-sources.js`).quantities(app, direction, order.id) : null
        if (source.currency !== 'EUR') continue
        const available = source.lines.filter((line) => line.kind === 'item').reduce((sum, line) => sum + b.cents(Math.max(0, (received ? Math.min(line.quantity, received.get(line.id) || 0) : line.quantity) - (coverage.get(line.id) || 0)) * line.unit_price), 0)
        if (available > 0) pending.push({ id: order.id, number: source.number, company_name: b.get(app, 'contacts_companies', source.company).getString('name'), amount: available / 100, kind: direction, source_type: direction === 'supplier' ? 'operation' : 'order', source_ids: direction === 'supplier' ? require(`${__hooks}/lib/billing-sources.js`).operations(app, direction, order.id).map((operation) => operation.id) : [order.id] })
      }
    }
    const deadlines = validated.flatMap((record) => record.schedules.filter((schedule) => schedule.balance > 0).map((schedule) => ({ ...schedule, document_id: record.id, kind: direction, number: record.number, company_name: record.company_name }))).sort((a, c) => a.due_date.localeCompare(c.due_date))
    result[direction] = { drafts: active.filter((record) => record.status === 'draft').length, due_count: validated.filter((record) => record.balance > 0).length, due_amount: validated.reduce((sum, record) => sum + b.cents(record.balance), 0) / 100, overdue_count: validated.filter((record) => record.overdue).length, overdue_amount: deadlines.filter((row) => row.due_date < b.today()).reduce((sum, row) => sum + b.cents(row.balance), 0) / 100, payments_month: paymentsMonth / 100, pending_count: canSources ? pending.length : null, pending_amount: canSources ? pending.reduce((sum, row) => sum + b.cents(row.amount), 0) / 100 : null, deadlines: deadlines.slice(0, 8), pending: pending.slice(0, 8), to_process: active.filter((record) => record.status === 'draft').slice(0, 8) }
  }
  return event.json(200, { date: b.today(), currency: 'EUR', ...result })
}
module.exports.preview = (event) => {
  b.guard(event.app, event.auth); const body = event.requestInfo().body; b.exact(body, ['kind', 'id', 'format', 'content_json']);
  if (body.content_json) { if (!b.policy.permissions(event.app, event.auth).includes('documents.template.manage')) throw new ForbiddenError('Accès à l’édition des modèles requis.'); require(`${__hooks}/lib/document-layout.js`).validate(body.content_json) }
  const record = b.get(event.app, b.config(body.kind).collection, body.id)
  if (!['html', 'pdf'].includes(body.format)) throw new BadRequestError('Format invalide.')
  const draft = record.getString('status') === 'draft' ? inputFrom(event.app, body.kind, record) : null
  const stored = record.getString('status') === 'validated' ? b.json(record, 'document_snapshot', null) : snapshot(event.app, body.kind, record, draft?.lines || b.rows(event.app, body.kind, record.id).map(b.lineDTO), draft?.deposit_percent ?? record.getFloat('deposit_percent'))
  const context = require(`${__hooks}/lib/billing-document.js`).context(stored, record), layout = body.content_json || stored.layout || require(`${__hooks}/lib/billing-document.js`).layout(event.app, record), rendered = require(`${__hooks}/lib/document-renderer.js`)(layout, context)
  const filename = `${b.config(body.kind).credit ? 'Avoir' : 'Facture'}_${record.getString('number') || 'Brouillon'}.pdf`
  if (body.format === 'pdf') return require(`${__hooks}/lib/gotenberg.js`)(event, layout, rendered, filename)
  return event.json(200, { html: rendered.preview, warnings: stored.warnings || [], filename, page: require(`${__hooks}/lib/document-layout.js`).pageDimensions(layout) })
}

module.exports.tracking = (event) => {
  b.guard(event.app, event.auth); const kind = event.request.pathValue('kind'), id = event.request.pathValue('id')
  if (!['customer', 'supplier'].includes(kind)) throw new BadRequestError('Source invalide.')
  if (!b.policy.permissions(event.app, event.auth).includes(kind === 'customer' ? 'sales.read' : 'purchasing.read')) throw new ForbiddenError('Accès au module source nécessaire.')
  const sources = require(`${__hooks}/lib/billing-sources.js`), source = sources.source(event.app, kind, id), covered = sources.coverage(event.app, kind), invoiced = sources.coverage(event.app, kind, '', false), delivered = sources.quantities(event.app, kind, id)
  return event.json(200, Object.fromEntries(source.lines.filter((line) => line.kind === 'item').map((line) => [source.tracking_ids?.[line.id] || line.id, { ordered: line.quantity, delivered: delivered.get(line.id) || 0, invoiced: invoiced.get(line.id) || 0, prepared: Math.max(0, (covered.get(line.id) || 0) - (invoiced.get(line.id) || 0)) }])))
}

module.exports.sourceReturnBlocks = (app, kind, id, user) => {
  const type = b.config(kind)
  // An active draft also owns its preparation quantities until explicitly cancelled.
  const lines = app.findRecordsByFilter(type.lines, `source_order = {:id} && ${type.parent}.status != "cancelled"`, '', 0, 0, { id })
  if (!lines.length) return []
  const message = 'Cette commande est liée à une facture ou un acompte. Annulez les brouillons liés ; une pièce validée conserve sa source.'
  if (!user || !b.policy.permissions(app, user).includes('billing.read')) return [{ message, href: '', label: '' }]
  const documents = [...new Set(lines.map((line) => line.getString(type.parent)))].map((id) => {
    const record = b.get(app, type.collection, id), draft = record.getString('status') === 'draft'
    return { message: draft ? 'Facture · Brouillon : annulez ce brouillon avant de revenir en devis.' : 'Facture · Validée : le retour en devis est bloqué pour conserver sa source. Utilisez Modifier la commande.', label: record.getString('number') || 'Facture brouillon', href: `/billing/${kind}/${record.id}` }
  })
  return documents
}

module.exports.assertSourceReturn = (app, kind, id) => {
  const blocks = module.exports.sourceReturnBlocks(app, kind, id)
  if (blocks.length) throw new BadRequestError(blocks[0].message)
}

module.exports.related = (event) => {
  b.guard(event.app, event.auth); const kind = event.request.pathValue('kind'), record = b.get(event.app, b.config(kind).collection, event.request.pathValue('id'))
  if (b.config(kind).direction !== 'customer') return event.json(200, { orders: [], deliveries: [] })
  const ids = b.json(record, 'source_orders'), operations = b.json(record, 'source_operations')
  return event.json(200, { orders: require(`${__hooks}/lib/sales-billing-links.js`)(event.app, event.auth, ids), deliveries: require(`${__hooks}/lib/stock-billing-links.js`)(event.app, event.auth, ids, operations) })
}
