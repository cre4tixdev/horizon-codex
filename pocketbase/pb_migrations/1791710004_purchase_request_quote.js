migrate((app) => {
  const collection = app.findCollectionByNameOrId('purchasing_requests')
  collection.fields.add(new RelationField({ name: 'source_quote', collectionId: app.findCollectionByNameOrId('sales_quotes').id, maxSelect: 1 }))
  app.save(collection)
  for (const request of app.findRecordsByFilter('purchasing_requests', 'source_order != ""', '', 0, 0)) {
    const order = app.findRecordById('sales_orders', request.getString('source_order'))
    request.set('source_quote', order.getString('quote')); app.save(request)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId('purchasing_requests')
  collection.fields.removeByName('source_quote'); app.save(collection)
})
