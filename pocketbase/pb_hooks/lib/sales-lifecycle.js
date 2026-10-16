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
    guard(event.app, event.auth, permission); let result; const documents = []
    event.app.runInTransaction((app) => {
      guard(app, event.auth, permission)
      const quote = app.findRecordById('sales_quotes', body.id), before = quote.publicExport()
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (body.target === 'draft' && !['validated', 'sent'].includes(quote.getString('status')) || body.target === 'validated' && quote.getString('status') !== 'accepted') throw new BadRequestError('Ce retour n’est pas disponible pour cet état.')
      const orders = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '', 0, 0, { id: quote.id })
      if (orders.some((order) => order.getString('status') !== 'confirmed')) throw new ApiError(409, 'La commande est en cours d’exécution. Ce retour est bloqué.')
      if (body.target === 'draft' && orders.length) throw new ApiError(409, 'Revenez d’abord de Commande client à Devis.')
      if (orders.length) documents.push(...require(`${__hooks}/lib/billing.js`).sourceReturnBlocks(app, 'customer', quote.id, event.auth))
      for (const order of orders) documents.push(...require(`${__hooks}/lib/purchasing.js`).returnBlocks(app, order, event.auth))
      // No write has occurred: report all blockers without committing a transition.
      if (documents.length) return
      for (const order of orders) {
        require(`${__hooks}/lib/stock.js`).release(app, event.auth, order);
        const previous = order.publicExport(); order.set('status', 'cancelled'); order.set('cancelled_at', new Date().toISOString()); order.set('cancellation_reason', 'Retour de la commande client en devis'); app.save(order)
        const entry = new Record(app.findCollectionByNameOrId('core_audit')); for (const [key, value] of Object.entries({ user: event.auth.id, module: 'sales', entity: 'sales_orders', entity_id: order.id, action: 'update', before: previous, after: order.publicExport(), metadata: { source: 'server', action: 'reopen_quote' } })) entry.set(key, value); app.save(entry)
      }
      quote.set('status', body.target); quote.set('accepted_at', '')
      if (body.target === 'draft') { quote.set('validated_at', ''); quote.set('validated_by', '') }
      app.save(quote); audit(app, event.auth, quote, before, 'reopen')
      require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'status_change', body.target === 'draft' ? 'Devis remis en brouillon' : 'Commande client remise en devis · commande précédente conservée dans l’historique', { action: 'update', changes: [{ field: 'status', label: 'État', before: body.target === 'draft' ? 'Devis' : 'Commande client', after: body.target === 'draft' ? 'Brouillon' : 'Devis' }] })
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return documents.length ? event.json(400, { message: 'Le retour en devis est bloqué par les documents liés ci-dessous. La commande est conservée.', data: { documents } }) : event.json(200, result)
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
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'customer_order_number', 'command_file', 'reservations', 'awaiting_customer_order', 'purchase_preparation'])
    let preparation = body.purchase_preparation
    if (typeof preparation === 'string') { try { preparation = JSON.parse(preparation) } catch { throw new BadRequestError('Préparation des achats invalide.') } }
    if (preparation !== undefined && (!Array.isArray(preparation) || !preparation.length || preparation.length > 200)) throw new BadRequestError('Préparation des achats invalide.')
    let reservations = body.reservations || []; if (typeof reservations === 'string') { try { reservations = JSON.parse(reservations) } catch { throw new BadRequestError('Réservations invalides.') } }; if (!Array.isArray(reservations)) throw new BadRequestError('Réservations invalides.');
    const reference = typeof body.customer_order_number === 'string' ? body.customer_order_number.trim() : ''
    if (reference.length > 120 || body.customer_order_number !== undefined && typeof body.customer_order_number !== 'string') throw new BadRequestError('Numéro de commande client invalide (120 caractères maximum).')
    const waiting = body.awaiting_customer_order === true || body.awaiting_customer_order === 'true'
    if (body.awaiting_customer_order !== undefined && ![true, false, 'true', 'false'].includes(body.awaiting_customer_order)) throw new BadRequestError('Choix Attente Commande invalide.')
    if (!reference && !waiting) throw new BadRequestError('Renseignez le numéro de commande client ou cochez Attente Commande.')
    if (reference && waiting) throw new BadRequestError('Une commande en attente ne doit pas contenir de numéro client.')
    let files = []
    if (event.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { files = event.findUploadedFiles('command_file') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } }
    if (files.length > 20) throw new BadRequestError('20 pièces de commande maximum.')
    let result
    event.app.runInTransaction((app) => {
      guard(app, event.auth, 'sales.order.confirm')
      const quote = app.findRecordById('sales_quotes', body.id)
      if (quote.getString('status') === 'accepted') { result = require(`${__hooks}/lib/sales.js`).dto(app, quote); return }
      if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'Le devis a été modifié. Rechargez la fiche.')
      if (!['validated', 'sent'].includes(quote.getString('status'))) throw new BadRequestError('Finalisez le devis avant de confirmer la commande client.')
      const details = lines(app, quote), before = quote.publicExport(), now = new Date().toISOString()
      const last = app.findRecordsByFilter('sales_orders', 'quote = {:id}', '-order_sequence', 1, 0, { id: quote.id })[0], sequence = (last?.getInt('order_sequence') || 0) + 1
      // Keep the root identity and a stable child for this commercial order.
      const order = new Record(app.findCollectionByNameOrId('sales_orders'))
      if (files.length > 1 && !order.collection().fields.getByName('customer_order_documents')) throw new BadRequestError('Appliquez la migration des pièces multiples avant de poursuivre.')
      for (const key of ['opportunity', 'analytic_account', 'company', 'contact', 'owner', 'currency', 'exchange_rate', 'subtotal', 'tax', 'total']) order.set(key, quote.get(key))
      const proof = require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, files.length ? 'document' : 'status_change', reference ? `Commande client confirmée · ${reference}` : 'Commande client confirmée · Attente Commande', { action: 'customer_order', changes: [{ field: 'status', label: 'État', before: ({ draft: 'Brouillon', validated: 'Devis', sent: 'Envoyé' })[quote.getString('status')], after: 'Commande client' }] })
      const documents = require(`${__hooks}/lib/sales-order-documents.js`)
      if (files.length) { proof.set('attachments', [files[0]]); const field = new FileField({ name: 'attachments', maxSelect: 1, maxSize: 10485760, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], protected: true }); try { field.validateValue(event.request.context(), app, proof) } catch { throw new BadRequestError('Choisissez des PDF ou images de 10 Mo maximum par fichier.') }; app.save(proof) }
      const documentIds = files.length ? [proof.id, ...files.slice(1).map((file) => documents.add(app, event, quote, file).id)] : []
      order.set('customer_order_documents', documentIds)
      for (const [key, value] of Object.entries({ quote: quote.id, order_sequence: sequence, order_number: `${quote.getString('quote_number')}-${sequence}`, status: 'confirmed', order_date: now, validated_at: now, validated_by: event.auth.id, customer_order_number: reference, customer_order_event: proof.id, quote_snapshot: { ...before, lines: details.map((line) => line.publicExport()) } })) order.set(key, value)
      order.set('analytic_child', require(`${__hooks}/lib/analytic-service.js`).order(app, quote).id)
      app.save(order)
      let position = 0
      for (const source of details.filter((line) => !line.getBool('is_option'))) {
        const line = new Record(app.findCollectionByNameOrId('sales_order_lines'))
        for (const key of ['kind', 'product', 'description', 'quantity', 'unit', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount']) line.set(key, source.get(key))
        line.set('position', ++position); line.set('order', order.id); line.set('source_line', source.id); line.set('snapshot', source.publicExport()); app.save(line)
      }
      require(`${__hooks}/lib/stock.js`).reserve(app, event.auth, order, reservations)
      if (!quote.getString('validated_at')) { quote.set('validated_at', now); quote.set('validated_by', event.auth.id) }
      quote.set('status', 'accepted'); quote.set('accepted_at', now); app.save(quote)
      if (preparation) require(`${__hooks}/lib/purchasing.js`).prepareConfirmed(app, event.auth, quote.id, preparation)
      audit(app, event.auth, quote, before, 'confirm', order)
      result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
    })
    return event.json(200, result)
  },
}

module.exports.customerOrderReference = (event) => {
  const body = event.requestInfo().body; exact(body, ['id', 'updated', 'customer_order_number', 'command_file', 'command_file_action', 'command_file_event', 'command_file_removals'])
  const fileAction = body.command_file_action === undefined ? 'keep' : body.command_file_action
  if (!['keep', 'append', 'replace', 'remove'].includes(fileAction)) throw new BadRequestError('Action de pièce jointe invalide.')
  let removals = body.command_file_removals === undefined ? [] : body.command_file_removals
  if (typeof removals === 'string') { try { removals = JSON.parse(removals) } catch { throw new BadRequestError('Retrait de pièces invalide.') } }
  if (!Array.isArray(removals) || removals.length > 20 || removals.some((id) => !/^[a-z0-9]{15}$/.test(id)) || new Set(removals).size !== removals.length || removals.length && fileAction !== 'append') throw new BadRequestError('Retrait de pièces invalide.')
  if (body.command_file_event !== undefined && (typeof body.command_file_event !== 'string' || !/^[a-z0-9]{15}$/.test(body.command_file_event))) throw new BadRequestError('Pièce de commande invalide.')
  if (typeof body.customer_order_number !== 'string' || body.customer_order_number.trim().length > 120) throw new BadRequestError('Numéro de commande client invalide (120 caractères maximum).')
  const value = body.customer_order_number.trim(), reference = value.toLowerCase() === 'attente commande' ? '' : value
  let files = []
  if (event.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { files = event.findUploadedFiles('command_file') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } }
  if (files.length > 20) throw new BadRequestError('20 pièces de commande maximum.')
  if (fileAction === 'replace' && files.length !== 1 || fileAction === 'remove' && files.length) throw new BadRequestError('Choisissez le fichier à remplacer ou retirez la pièce sans nouveau fichier.')
  let result
  event.app.runInTransaction((app) => {
    guard(app, event.auth, 'sales.order.confirm')
    const quote = app.findRecordById('sales_quotes', body.id)
    if (quote.getString('updated') !== body.updated) throw new ApiError(409, 'La commande a été modifiée. Rechargez la fiche.')
    if (quote.getString('status') !== 'accepted' || quote.getString('archived_at')) throw new BadRequestError('Choisissez une commande confirmée non archivée.')
    const order = app.findFirstRecordByFilter('sales_orders', 'quote = {:id} && status = "confirmed"', { id: quote.id }), before = order.publicExport()
    const changedDocuments = require(`${__hooks}/lib/sales-order-documents.js`).update(app, event, quote, order, files, fileAction, body.command_file_event, removals)
    if (order.getString('customer_order_number') !== reference || changedDocuments) {
      order.set('customer_order_number', reference); app.save(order); app.save(quote)
      require(`${__hooks}/lib/access-policy.js`).audit(app, 'sales_orders', order.id, event.auth.id, before, order.publicExport(), 'update')
      if (before.customer_order_number !== reference) require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'change', 'Référence de commande client mise à jour', { action: 'update', changes: [{ field: 'customer_order_number', label: 'Numéro de commande client', before: before.customer_order_number || 'Attente Commande', after: reference || 'Attente Commande' }] })
    }
    result = require(`${__hooks}/lib/sales.js`).dto(app, quote)
  }); return event.json(200, result)
}
