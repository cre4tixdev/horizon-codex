routerAdd('GET', '/api/horizon/sales/quotes/summary', (event) => require(`${__hooks}/lib/sales.js`).summary(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/quotes', (event) => require(`${__hooks}/lib/sales.js`).list(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/choices', (event) => require(`${__hooks}/lib/sales.js`).choices(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/quotes/{id}', (event) => require(`${__hooks}/lib/sales.js`).record(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/quotes/save', (event) => require(`${__hooks}/lib/sales.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/quotes/cancel', (event) => require(`${__hooks}/lib/sales.js`).cancel(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/opportunities/{id}', (event) => require(`${__hooks}/lib/sales.js`).related(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/settings', (event) => require(`${__hooks}/lib/sales-settings.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/settings', (event) => require(`${__hooks}/lib/sales-settings.js`).save(event), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/sales/salespeople', (event) => require(`${__hooks}/lib/sales.js`).salespeople(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/quotes/finalize', (event) => require(`${__hooks}/lib/sales-lifecycle.js`).finalize(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/quotes/confirm', (event) => require(`${__hooks}/lib/sales-lifecycle.js`).confirm(event), $apis.requireAuth('core_users'))
onRecordUpdate((event) => {
  const before = event.record.original()
  if (event.record.getString('status') === 'sent' && !before.getString('sent_at')) event.record.set('sent_at', new Date().toISOString())
  if (before.getString('sent_at') && event.record.getString('sent_at') !== before.getString('sent_at')) throw new BadRequestError('L’historique d’envoi doit être conservé.')
  if (before.getString('status') !== 'draft') {
    for (const field of ['quote_number', 'opportunity', 'analytic_account', 'company', 'contact', 'owner', 'currency', 'exchange_rate', 'title', 'notes', 'quote_date', 'valid_until', 'subtotal', 'tax', 'total', 'discount', 'discount_amount', 'tax_rate', 'terms_id', 'terms_content', 'cost_total', 'margin_amount']) if (JSON.stringify(event.record.get(field)) !== JSON.stringify(before.get(field))) throw new BadRequestError('Les données du devis finalisé sont figées.')
  }
  event.next()
}, 'sales_quotes')
onRecordUpdate((event) => { const quote = event.app.findRecordById('sales_quotes', event.record.getString('quote')); if (quote.getString('status') !== 'draft') throw new BadRequestError('Les lignes du devis finalisé sont figées.'); event.next() }, 'sales_quote_lines')
onRecordDelete((event) => { const quote = event.app.findRecordById('sales_quotes', event.record.getString('quote')); if (quote.getString('status') !== 'draft') throw new BadRequestError('Les lignes du devis finalisé sont figées.'); event.next() }, 'sales_quote_lines')
onRecordUpdate((event) => { require(`${__hooks}/lib/sales-order-revision-guard.js`).line(event.app, event.record); event.next() }, 'sales_order_lines')
onRecordDelete((event) => { require(`${__hooks}/lib/sales-order-revision-guard.js`).line(event.app, event.record, true); event.next() }, 'sales_order_lines')

routerAdd('POST', '/api/horizon/sales/quotes/reopen', (event) => require(`${__hooks}/lib/sales-lifecycle.js`).reopen(event), $apis.requireAuth('core_users'))

routerAdd('POST', '/api/horizon/sales/quotes/manage', (event) => require(`${__hooks}/lib/sales-lifecycle.js`).manage(event), $apis.requireAuth('core_users'))
onRecordCreate((event) => { if (event.app.findRecordById('sales_quotes', event.record.getString('quote')).getString('status') !== 'draft') throw new BadRequestError('Les lignes du devis finalisé sont figées.'); event.next() }, 'sales_quote_lines')
onRecordDelete((event) => { if (event.record.getString('sent_at') || event.record.getString('status') === 'sent' || event.app.findRecordsByFilter('sales_orders', 'quote = {:id}', '', 1, 0, { id: event.record.id }).length) throw new BadRequestError('Cette pièce doit être conservée.'); event.next() }, 'sales_quotes')
onRecordUpdate((event) => {
  const before = event.record.original(), record = event.record
  if (before.getString('status') !== 'draft') {
    for (const field of ['quote', 'order_number', 'order_sequence', 'opportunity', 'analytic_account', 'analytic_child', 'company', 'contact', 'currency', 'exchange_rate', 'quote_snapshot', 'order_date']) if (JSON.stringify(record.get(field)) !== JSON.stringify(before.get(field))) throw new BadRequestError('L’identité et le devis accepté de la commande sont conservés.')
    if (['owner', 'subtotal', 'tax', 'total', 'current_revision', 'revision_number'].some((field) => JSON.stringify(record.get(field)) !== JSON.stringify(before.get(field)))) require(`${__hooks}/lib/sales-order-revision-guard.js`).order(event.app, record)
  }
  event.next()
}, 'sales_orders')
onRecordCreate((event) => {
  const order = event.app.findRecordById('sales_orders', event.record.getString('order'))
  if (order.getString('current_revision')) require(`${__hooks}/lib/sales-order-revision-guard.js`).line(event.app, event.record)
  event.next()
}, 'sales_order_lines')
onRecordUpdate(() => { throw new BadRequestError('Une révision validée est conservée sans modification.') }, 'sales_order_revisions')
onRecordDelete(() => { throw new BadRequestError('Les révisions de commande doivent être conservées.') }, 'sales_order_revisions')
routerAdd('POST', '/api/horizon/sales/orders/revision-preview', (event) => require(`${__hooks}/lib/sales-order-revisions.js`).preview(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/sales/orders/revise', (event) => require(`${__hooks}/lib/sales-order-revisions.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/sales/orders/{id}/revisions', (event) => require(`${__hooks}/lib/sales-order-revisions.js`).history(event), $apis.requireAuth('core_users'))
onRecordDelete(() => { throw new BadRequestError('Les commandes doivent être conservées dans l’historique.') }, 'sales_orders')

routerAdd('POST', '/api/horizon/sales/quotes/customer-order-reference', (event) => require(`${__hooks}/lib/sales-lifecycle.js`).customerOrderReference(event), $apis.requireAuth('core_users'))
