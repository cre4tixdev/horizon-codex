migrate((app) => {
  const collection = app.findCollectionByNameOrId('purchasing_orders')
  collection.fields.add(new RelationField({ name: 'owner', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1 }))
  collection.fields.add(new RelationField({ name: 'delivery_warehouse', collectionId: app.findCollectionByNameOrId('inventory_warehouses').id, maxSelect: 1 }))
  app.save(collection)
  const warehouses = app.findRecordsByFilter('inventory_warehouses', 'active = true', '', 2, 0)
  for (const order of app.findRecordsByFilter('purchasing_orders', 'status = "draft"', '', 0, 0)) {
    order.set('owner', order.getString('created_by'))
    if (warehouses.length === 1) order.set('delivery_warehouse', warehouses[0].id)
    app.save(order)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId('purchasing_orders')
  collection.fields.removeByName('owner')
  collection.fields.removeByName('delivery_warehouse')
  app.save(collection)
})
