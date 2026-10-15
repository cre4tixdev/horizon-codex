const c = require(`${__hooks}/lib/purchasing-common.js`)
const json = (record, field, fallback = {}) => JSON.parse(record.getString(field) || 'null') || fallback
const rows = (app, order) => app.findRecordsByFilter('sales_order_lines', 'order = {:id}', 'position,id', 0, 0, { id: order.id })
const guard = (app, user) => {
  const rights = c.policy.permissions(app, user)
  if (user.getString('erp_profile') === 'viewer' || !['sales.read', 'sales.write', 'sales.order.confirm', 'crm.read'].every((right) => rights.includes(right))) throw new ForbiddenError('Droits de modification et confirmation de commande nécessaires.')
}
const current = (app, quote, order) => {
  const revision = order.getString('current_revision') ? c.get(app, 'sales_order_revisions', order.getString('current_revision')) : null
  const saved = revision ? json(revision, 'after_snapshot') : null
  return { order_updated: order.getString('updated'), header: saved?.header || quote.publicExport(), order: { owner: order.getString('owner'), subtotal: order.getFloat('subtotal'), tax: order.getFloat('tax'), total: order.getFloat('total'), customer_order_number: order.getString('customer_order_number') }, lines: rows(app, order).map((line) => ({ ...json(line, 'snapshot'), ...Object.fromEntries(['kind', 'product', 'description', 'quantity', 'unit', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount', 'position', 'source_line'].map((key) => [key, line.get(key)])), record_id: line.id, id: line.getString('source_line') })) }
}
const context = (app, user, body) => {
  guard(app, user); c.exact(body, ['id', 'updated', 'input', 'customer_order_number', 'preview_token'])
  const quote = c.get(app, 'sales_quotes', body.id)
  if (quote.getString('status') !== 'accepted' || quote.getString('archived_at')) throw new BadRequestError('Choisissez une commande confirmée non archivée.')
  if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'La commande a changé. Rechargez la fiche.')
  const order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '-order_sequence,id', 1, 0, { id: quote.id })[0]
  if (!order || order.getString('status') !== 'confirmed') throw new BadRequestError('Cette commande ne peut pas être révisée dans son état actuel.')
  const before = current(app, quote, order), input = body.input
  c.exact(input, ['opportunity', 'title', 'quote_date', 'valid_until', 'notes', 'lines', 'discount', 'discount_mode', 'terms_id', 'owner'])
  if (input.opportunity !== quote.getString('opportunity')) throw new BadRequestError('L’affaire et le client de la commande sont conservés.')
  const title = c.text(input.title, 200, true), notes = input.notes || '', owner = input.owner || order.getString('owner')
  c.text(notes, 10000)
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, c.get(app, 'core_users', owner), false, 'sales')) throw new BadRequestError('Choisissez un commercial actif habilité aux ventes.')
  if (input.terms_id !== before.header.terms_id) throw new BadRequestError('Les conditions acceptées sont conservées dans cette première version.')
  if (input.quote_date !== quote.getString('quote_date').slice(0, 10) || input.valid_until !== quote.getString('valid_until').slice(0, 10)) throw new BadRequestError('Les dates du devis accepté sont conservées.')
  const priced = require(`${__hooks}/lib/pricing.js`).quoteLines(input.lines, input.discount || 0, input.discount_mode || 'percent', true)
  if (priced.lines.some((line) => line.is_option)) throw new BadRequestError('Une commande ne contient pas de ligne optionnelle. Ajoutez une ligne commandée.')
  if (!priced.lines.some((line) => line.kind === 'item')) throw new BadRequestError('Conservez au moins une ligne article dans la commande.')
  const seen = new Set()
  const proposed = priced.lines.map((line, index) => {
    const id = input.lines[index].id || '', old = before.lines.find((item) => item.id === id)
    if (id && (!old || seen.has(id))) throw new BadRequestError('Ligne étrangère ou répétée dans la commande.')
    if (!id && line.kind === 'item' && !line.quantity) throw new BadRequestError('Une nouvelle ligne doit avoir une quantité positive.')
    if (id) seen.add(id)
    return { ...line, id, record_id: old?.record_id || '', source_line: id }
  })
  require(`${__hooks}/lib/sales-line-catalog.js`)(app, user, order.getString('currency'), { lines: proposed }, before.lines)
  const taxes = require(`${__hooks}/lib/tax.js`).quote(proposed, before.header.tax_rate)
  const after = { header: { ...before.header, title, notes, owner, ...Object.fromEntries(Object.entries(priced).filter(([key]) => key !== 'lines')), tax: taxes.tax, total: (Math.round(priced.subtotal * 100) + Math.round(taxes.tax * 100)) / 100 }, order: { owner, subtotal: priced.subtotal, tax: taxes.tax, total: (Math.round(priced.subtotal * 100) + Math.round(taxes.tax * 100)) / 100, customer_order_number: c.text(body.customer_order_number || '', 120).replace(/^attente commande$/i, '') }, lines: taxes.lines }
  const stock = require(`${__hooks}/lib/stock-order-revision.js`).plan(app, user, order, before.lines, after.lines)
  const purchases = require(`${__hooks}/lib/purchasing-order-revision.js`)(app, user, order, before.lines, after.lines)
  const billing = require(`${__hooks}/lib/billing-order-revision.js`).plan(app, user, order, before.lines, after.lines)
  const blocks = [...stock.blocks, ...purchases.blocks, ...billing.blocks]
  const changes = []
  for (const field of ['title', 'notes', 'owner', 'discount', 'discount_mode', 'subtotal', 'tax', 'total']) if (JSON.stringify(before.header[field]) !== JSON.stringify(after.header[field])) changes.push({ label: ({ title: 'Titre', notes: 'Notes', owner: 'Commercial', discount: 'Remise globale', discount_mode: 'Mode de remise', subtotal: 'Total HT', tax: 'TVA', total: 'Total TTC' })[field], before: field === 'owner' ? c.get(app, 'core_users', before.header[field]).getString('name') : field === 'discount_mode' ? before.header[field] === 'amount' ? 'Montant' : 'Pourcentage' : String(before.header[field] ?? ''), after: field === 'owner' ? c.get(app, 'core_users', after.header[field]).getString('name') : field === 'discount_mode' ? after.header[field] === 'amount' ? 'Montant' : 'Pourcentage' : String(after.header[field] ?? '') })
  if (before.order.customer_order_number !== after.order.customer_order_number) changes.push({ label: 'Numéro de commande client', before: before.order.customer_order_number || 'Attente Commande', after: after.order.customer_order_number || 'Attente Commande' })
  for (const old of before.lines) {
    const next = after.lines.find((line) => line.id === old.id)
    if (!next) changes.push({ label: `Ligne ${old.position} · ${old.description}`, before: 'Présente', after: 'Supprimée' })
    else if (['position', 'description', 'quantity', 'unit_price', 'unit_cost', 'discount', 'product', 'kind', 'brand', 'reference', 'show_total', 'unit', 'product_supplier', 'price_source', 'margin_percent'].some((key) => JSON.stringify(old[key] ?? '') !== JSON.stringify(next[key] ?? ''))) changes.push({ label: `Ligne ${old.position} · ${old.description}`, before: `${old.quantity} ${old.unit} · ${old.unit_price} HT`, after: `${next.description} · ${next.quantity} ${next.unit} · ${next.unit_price} HT` })
  }
  for (const line of after.lines.filter((item) => !item.id)) changes.push({ label: 'Nouvelle ligne', before: '', after: line.description })
  // A new catalogue snapshot is captured again on save; its clock is not an engagement.
  const fingerprint = { ...after, lines: after.lines.map((line) => ({ ...line, catalog_snapshot: line.catalog_snapshot ? Object.fromEntries(Object.entries(line.catalog_snapshot).filter(([key]) => key !== 'captured_at')) : line.catalog_snapshot })) }
  const token = c.hash({ before, after: fingerprint, stock, purchases, billing })
  return { quote, order, before, after, stock, billing, impacts: [...stock.impacts, ...billing.impacts], blocks, changes, token }
}
module.exports = {
  current,
  preview(event) {
    const plan = context(event.app, event.auth, event.requestInfo().body)
    return event.json(200, { token: plan.token, changes: plan.changes, impacts: plan.impacts, blocks: plan.blocks })
  },
  save(event) {
    let result
    event.app.runInTransaction((app) => {
      const body = event.requestInfo().body, plan = context(app, event.auth, body)
      if (body.preview_token !== plan.token) throw new ApiError(409, 'Les engagements ont changé. Recalculez le récapitulatif avant de confirmer.')
      if (plan.blocks.length) throw new BadRequestError(plan.blocks[0].message)
      if (!plan.changes.length && !plan.stock.impacts.length) { result = require(`${__hooks}/lib/sales.js`).dto(app, plan.quote); return }
      const { order, quote, before, after } = plan
      const credits = require(`${__hooks}/lib/billing-order-revision.js`).apply(app, event.auth, order, plan.billing)
      plan.impacts.push(...credits)
      for (const line of after.lines) if (!line.id) { line.record_id = $security.randomString(15).toLowerCase(); line.id = line.record_id; line.source_line = line.id }
      const revision = new Record(app.findCollectionByNameOrId('sales_order_revisions'))
      for (const [key, value] of Object.entries({ order: order.id, number: order.getInt('revision_number') + 1, status: 'validated', actor: event.auth.id, before_snapshot: before, after_snapshot: after, changes: plan.changes, impacts: plan.impacts })) revision.set(key, value)
      app.save(revision)
      const previous = order.publicExport()
      for (const [key, value] of Object.entries(after.order)) order.set(key, value)
      order.set('current_revision', revision.id); order.set('revision_number', revision.getInt('number')); app.save(order)
      const existing = rows(app, order)
      for (const old of existing) if (!after.lines.some((line) => line.record_id === old.id)) app.delete(old)
      for (const value of after.lines) {
        const record = existing.find((line) => line.id === value.record_id) || new Record(app.findCollectionByNameOrId('sales_order_lines'))
        record.set('id', value.record_id); record.set('order', order.id)
        for (const key of ['kind', 'product', 'description', 'quantity', 'unit', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount', 'position', 'source_line']) record.set(key, value[key])
        record.set('snapshot', value); app.save(record)
      }
      require(`${__hooks}/lib/stock-order-revision.js`).apply(app, event.auth, plan.stock)
      app.save(quote)
      c.policy.audit(app, 'sales_orders', order.id, event.auth.id, previous, order.publicExport(), 'update')
      require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'change', `Commande modifiée · révision ${revision.getInt('number')}`, { action: 'order_revision', revision: revision.id, changes: plan.changes.map((change, index) => ({ field: `revision_${index}`, label: change.label, before: change.before, after: change.after })) })
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
  history(event) {
    if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, false, 'sales')) throw new ForbiddenError('Accès aux ventes nécessaire.')
    const order = c.get(event.app, 'sales_orders', event.request.pathValue('id'))
    return event.json(200, { items: event.app.findRecordsByFilter('sales_order_revisions', 'order = {:id} && status = "validated"', '-number', 200, 0, { id: order.id }).map((record) => ({ id: record.id, number: record.getInt('number'), created: record.getString('created'), author: c.get(event.app, 'core_users', record.getString('actor')).getString('name'), currency: order.getString('currency'), changes: json(record, 'changes', []), impacts: json(record, 'impacts', []).filter((impact) => !impact.href.startsWith('/billing/') || c.policy.permissions(event.app, event.auth).includes('billing.read')).filter((impact) => !impact.href.startsWith('/inventory/') || c.policy.permissions(event.app, event.auth).includes('inventory.read')) })) })
  },
}
