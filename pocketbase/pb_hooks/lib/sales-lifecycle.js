const guard = (app, user, permission) => {
  const rights = require(`${__hooks}/lib/access-policy.js`).permissions(app, user)
  if (user?.getString('erp_profile') === 'viewer' || !rights.includes('sales.read') || !rights.includes(permission)) throw new ForbiddenError('Vous ne disposez pas des droits de validation.')
}
const exact = (body, fields) => { if (!/^[a-z0-9]{15}$/.test(body.id || '') || typeof body.updated !== 'string') throw new BadRequestError('Devis ou version invalide.'); if (Object.keys(body).some((key) => !fields.includes(key))) throw new BadRequestError('Champs non autorisés.') }
const lines = (app, quote) => {
  if (quote.getString('archived_at')) throw new BadRequestError('Réactivez le devis avant de poursuivre.');
  const result = app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id })
  if (!result.some((line) => line.getString('kind') === 'item' && !line.getBool('is_option'))) throw new BadRequestError('Ajoutez au moins un article hors option avant de confirmer le devis.')
  const opp = app.findRecordById('crm_opportunities', quote.getString('opportunity'))
  if (!opp.getBool('active')) throw new BadRequestError('L’opportunité est archivée.')
  return result
}
const audit = (app, actor, quote, before, action, order) => {
  const item = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor.id, module: 'sales', entity: 'sales_quotes', entity_id: quote.id, action: 'update', before, after: quote.publicExport(), metadata: { source: 'server', action, order: order?.id || '' } })) item.set(key, value)
  app.save(item)
  if (order) {
    const created = new Record(app.findCollectionByNameOrId('core_audit'))
    for (const [key, value] of Object.entries({ user: actor.id, module: 'sales', entity: 'sales_orders', entity_id: order.id, action: 'create', after: order.publicExport(), metadata: { source: 'server', quote: quote.id } })) created.set(key, value)
    app.save(created)
  }
}
module.exports = {
  manage(event) {
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'action'])
    if (!['archive', 'restore', 'delete'].includes(body.action)) throw new BadRequestError('Action invalide.')
    let result
    event.app.runInTransaction((app) => {
      if (!require(`${__hooks}/lib/activity.js`).allowed(app, event.auth, true, 'sales')) throw new ForbiddenError('Accès aux devis refusé.')
      const quote = app.findRecordById('sales_quotes', body.id), before = quote.publicExport()
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (body.action === 'delete') {
        if (quote.getString('sent_at') || quote.getString('status') === 'sent' || app.findRecordsByFilter('sales_orders', 'quote = {:id}', '', 1, 0, { id: quote.id }).length) throw new BadRequestError('Un devis envoyé ou lié à une commande doit être conservé. Archivez-le.')
        const entry = new Record(app.findCollectionByNameOrId('core_audit')); for (const [key, value] of Object.entries({ user: event.auth.id, module: 'sales', entity: 'sales_quotes', entity_id: quote.id, action: 'delete', before: { ...before, lines: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id }).map((line) => line.publicExport()) }, metadata: { source: 'server' } })) entry.set(key, value); app.save(entry)
        quote.set('status', 'draft'); app.save(quote)
        for (const line of app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', '', 0, 0, { id: quote.id })) app.delete(line)
        app.delete(quote); result = { deleted: true }; return
      }
      quote.set('archived_at', body.action === 'archive' ? new Date().toISOString() : ''); app.save(quote); audit(app, event.auth, quote, before, body.action)
      require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'status_change', body.action === 'archive' ? 'Devis archivé' : 'Devis réactivé', { action: 'update' })
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
  reopen(event) {
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'target'])
    if (!['draft', 'validated'].includes(body.target)) throw new BadRequestError('État de retour invalide.')
    const permission = body.target === 'draft' ? 'sales.quote.validate' : 'sales.order.confirm'
    guard(event.app, event.auth, permission); let result
    event.app.runInTransaction((app) => {
      guard(app, event.auth, permission)
      const quote = app.findRecordById('sales_quotes', body.id), before = quote.publicExport()
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (body.target === 'draft' && !['validated', 'sent'].includes(quote.getString('status')) || body.target === 'validated' && quote.getString('status') !== 'accepted') throw new BadRequestError('Ce retour n’est pas disponible pour cet état.')
      const orders = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '', 0, 0, { id: quote.id })
      if (orders.some((order) => order.getString('status') !== 'confirmed')) throw new ApiError(409, 'La commande est en cours d’exécution. Ce retour est bloqué.')
      if (body.target === 'draft' && orders.length) throw new ApiError(409, 'Revenez d’abord de Commande client à Devis.')
      for (const order of orders) {
        const previous = order.publicExport(); order.set('status', 'cancelled'); order.set('cancelled_at', new Date().toISOString()); order.set('cancellation_reason', 'Retour de la commande client en devis'); app.save(order)
        const entry = new Record(app.findCollectionByNameOrId('core_audit')); for (const [key, value] of Object.entries({ user: event.auth.id, module: 'sales', entity: 'sales_orders', entity_id: order.id, action: 'update', before: previous, after: order.publicExport(), metadata: { source: 'server', action: 'reopen_quote' } })) entry.set(key, value); app.save(entry)
      }
      quote.set('status', body.target); quote.set('accepted_at', '')
      if (body.target === 'draft') { quote.set('validated_at', ''); quote.set('validated_by', '') }
      app.save(quote); audit(app, event.auth, quote, before, 'reopen')
      require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'status_change', body.target === 'draft' ? 'Devis remis en brouillon' : 'Commande client remise en devis · commande précédente conservée dans l’historique', { action: 'update', changes: [{ field: 'status', label: 'État', before: body.target === 'draft' ? 'Devis' : 'Commande client', after: body.target === 'draft' ? 'Brouillon' : 'Devis' }] })
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
  finalize(event) {
    guard(event.app, event.auth, 'sales.quote.validate')
    const body = event.requestInfo().body; exact(body, ['id', 'updated']); let result
    event.app.runInTransaction((app) => {
      guard(app, event.auth, 'sales.quote.validate')
      const quote = app.findRecordById('sales_quotes', body.id)
      if (quote.getString('status') === 'validated') { result = require(`${__hooks}/lib/sales.js`).dto(app, quote); return }
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (quote.getString('status') !== 'draft') throw new BadRequestError('Seul un brouillon peut être finalisé.')
      lines(app, quote)
      const before = quote.publicExport()
      quote.set('status', 'validated'); quote.set('validated_at', new Date().toISOString()); quote.set('validated_by', event.auth.id); app.save(quote)
      audit(app, event.auth, quote, before, 'finalize')
      require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'status_change', 'Devis finalisé', { action: 'update', changes: [{ field: 'status', label: 'État', before: 'Brouillon', after: 'Devis' }] })
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
  confirm(event) {
    guard(event.app, event.auth, 'sales.order.confirm')
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'customer_order_number', 'command_file'])
    const reference = typeof body.customer_order_number === 'string' ? body.customer_order_number.trim() : ''
    if (reference.length > 120 || body.customer_order_number !== undefined && typeof body.customer_order_number !== 'string') throw new BadRequestError('Numéro de commande client invalide (120 caractères maximum).')
    let files = []
    if (event.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { files = event.findUploadedFiles('command_file') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } }
    if (files.length > 1) throw new BadRequestError('Une seule pièce de commande est autorisée.')
    let result
    event.app.runInTransaction((app) => {
      guard(app, event.auth, 'sales.order.confirm')
      const quote = app.findRecordById('sales_quotes', body.id)
      if (quote.getString('status') === 'accepted') { result = require(`${__hooks}/lib/sales.js`).dto(app, quote); return }
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (!['validated', 'sent'].includes(quote.getString('status'))) throw new BadRequestError('Finalisez le devis avant de confirmer la commande client.')
      const details = lines(app, quote), before = quote.publicExport(), now = new Date().toISOString()
      const last = app.findRecordsByFilter('sales_orders', 'quote = {:id}', '-order_sequence', 1, 0, { id: quote.id })[0], sequence = (last?.getInt('order_sequence') || 0) + 1
      // The CRM root remains on analytic_account. This suffix numbers only the order document.
      const order = new Record(app.findCollectionByNameOrId('sales_orders'))
      for (const key of ['opportunity', 'analytic_account', 'company', 'contact', 'owner', 'currency', 'exchange_rate', 'subtotal', 'tax', 'total']) order.set(key, quote.get(key))
      const proof = require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, files.length ? 'document' : 'status_change', reference ? `Commande client confirmée · ${reference}` : files.length ? 'Commande client confirmée' : 'Commande client confirmée · Attente Commande', { action: 'customer_order', changes: [{ field: 'status', label: 'État', before: ({ draft: 'Brouillon', validated: 'Devis', sent: 'Envoyé' })[quote.getString('status')], after: 'Commande client' }] })
      if (files.length) { proof.set('attachments', files); const field = new FileField({ name: 'attachments', maxSelect: 5, maxSize: 10485760, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], protected: true }); try { field.validateValue(event.request.context(), app, proof) } catch { throw new BadRequestError('Choisissez un PDF ou une image de 10 Mio maximum.') }; app.save(proof) }
      for (const [key, value] of Object.entries({ quote: quote.id, order_sequence: sequence, order_number: `${quote.getString('quote_number')}-${sequence}`, status: 'confirmed', order_date: now, validated_at: now, validated_by: event.auth.id, customer_order_number: reference, customer_order_event: proof.id, quote_snapshot: { ...before, lines: details.map((line) => line.publicExport()) } })) order.set(key, value)
      app.save(order)
      let position = 0
      for (const source of details.filter((line) => !line.getBool('is_option'))) {
        const line = new Record(app.findCollectionByNameOrId('sales_order_lines'))
        for (const key of ['kind', 'product', 'description', 'quantity', 'unit', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount']) line.set(key, source.get(key))
        line.set('position', ++position); line.set('order', order.id); line.set('source_line', source.id); line.set('snapshot', source.publicExport()); app.save(line)
      }
      if (!quote.getString('validated_at')) { quote.set('validated_at', now); quote.set('validated_by', event.auth.id) }
      quote.set('status', 'accepted'); quote.set('accepted_at', now); app.save(quote)
      audit(app, event.auth, quote, before, 'confirm', order)
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
}
