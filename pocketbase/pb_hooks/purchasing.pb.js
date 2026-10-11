routerAdd('GET', '/api/horizon/purchasing/choices', (event) => require(`${__hooks}/lib/purchasing.js`).choices(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/products/{id}', (event) => require(`${__hooks}/lib/purchasing.js`).product(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/needs/{id}', (event) => require(`${__hooks}/lib/purchasing.js`).needs(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/generate-orders', (event) => require(`${__hooks}/lib/purchasing.js`).generateOrders(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/requests', (event) => require(`${__hooks}/lib/purchasing.js`).list(event, 'request'), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/requests/{id}', (event) => require(`${__hooks}/lib/purchasing.js`).record(event, 'request'), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/requests/save', (event) => require(`${__hooks}/lib/purchasing.js`).save(event, 'request'), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/requests/transition', (event) => require(`${__hooks}/lib/purchasing.js`).transition(event, 'request'), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/orders', (event) => require(`${__hooks}/lib/purchasing.js`).list(event, 'order'), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/orders/{id}', (event) => require(`${__hooks}/lib/purchasing.js`).record(event, 'order'), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/orders/save', (event) => require(`${__hooks}/lib/purchasing.js`).save(event, 'order'), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/orders/transition', (event) => require(`${__hooks}/lib/purchasing.js`).transition(event, 'order'), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/purchasing/settings', (event) => require(`${__hooks}/lib/purchasing.js`).settings(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/purchasing/settings', (event) => require(`${__hooks}/lib/purchasing.js`).settings(event), $apis.requireAuth('core_users'))
onRecordDelete(() => { throw new BadRequestError('Archivez la pièce d’achat pour conserver son historique.') }, 'purchasing_requests', 'purchasing_orders')

routerAdd('GET', '/api/horizon/purchasing/tracking/{id}', (e) => require(`${__hooks}/lib/purchasing.js`).tracking(e), $apis.requireAuth('core_users'))
onRecordUpdate((e) => { const before = e.record.original(); if (before.getString('status') && before.getString('status') !== 'draft') for (const key of ['title', 'owner', 'delivery_warehouse', 'currency', 'opportunity', 'source_order', 'supplier', 'document_date', 'needed_date', 'notes', 'exchange_rate', 'subtotal', 'tax', 'total', 'tax_rate', 'document_snapshot']) if (require(`${__hooks}/lib/purchasing-common.js`).hash(before.get(key)) !== require(`${__hooks}/lib/purchasing-common.js`).hash(e.record.get(key))) throw new BadRequestError('Les informations d’une pièce d’achat validée sont figées.'); e.next() }, 'purchasing_requests', 'purchasing_orders')
onRecordUpdate((e) => { const kind = e.record.collection().name === 'purchasing_request_lines' ? 'request' : 'order'; if (e.app.findRecordById(`purchasing_${kind}s`, e.record.getString(kind)).getString('status') !== 'draft') throw new BadRequestError('Les lignes d’une pièce d’achat validée sont figées.'); e.next() }, 'purchasing_request_lines', 'purchasing_order_lines')
onRecordDelete((e) => { const kind = e.record.collection().name === 'purchasing_request_lines' ? 'request' : 'order'; if (e.app.findRecordById(`purchasing_${kind}s`, e.record.getString(kind)).getString('status') !== 'draft') throw new BadRequestError('Les lignes validées sont conservées.'); e.next() }, 'purchasing_request_lines', 'purchasing_order_lines')

// Financial line allocations are part of the frozen document, like prices.
const purchaseAllocationGuard = (e) => {
  const kind = e.record.collection().name === 'purchasing_request_line_allocations' ? 'request' : 'order'
  const line = e.app.findRecordById(`purchasing_${kind}_lines`, e.record.getString(`${kind}_line`))
  if (e.app.findRecordById(`purchasing_${kind}s`, line.getString(kind)).getString('status') !== 'draft') throw new BadRequestError('La ventilation d’une pièce validée est figée.')
  e.next()
}
onRecordCreate(purchaseAllocationGuard, 'purchasing_request_line_allocations', 'purchasing_order_line_allocations')
onRecordUpdate(purchaseAllocationGuard, 'purchasing_request_line_allocations', 'purchasing_order_line_allocations')
onRecordDelete(purchaseAllocationGuard, 'purchasing_request_line_allocations', 'purchasing_order_line_allocations')

// Actual Messaging/status changes also refresh the source request; validation is not sending.
onRecordUpdate((event) => {
  const changed = event.record.original().getString('status') !== event.record.getString('status')
  event.next()
  if (changed) require(`${__hooks}/lib/purchasing.js`).refreshRequests(event.app, event.record)
}, 'purchasing_orders')

onRecordDelete((event) => {
  if (require(`${__hooks}/lib/purchasing.js`).referencesQuote(event.app, event.record.id)) throw new BadRequestError('Ce devis est lié à une demande d’achat et doit être conservé. Archivez-le.')
  event.next()
}, 'sales_quotes')
