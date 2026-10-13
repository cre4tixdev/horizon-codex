migrate((app) => {
  const orders = app.findCollectionByNameOrId('sales_orders'), events = app.findCollectionByNameOrId('core_activity_events')
  orders.fields.add(new RelationField({ name: 'customer_order_documents', collectionId: events.id, maxSelect: 20, cascadeDelete: false })); app.save(orders)
  for (const order of app.findAllRecords(orders)) {
    const id = order.getString('customer_order_event')
    if (id && app.findRecordById(events.id, id).getStringSlice('attachments').length) { order.set('customer_order_documents', [id]); app.save(order) }
  }
}, () => { throw new Error('Rollback refusé : conserver les relations des pièces de commande ; utiliser une migration corrective.') })
