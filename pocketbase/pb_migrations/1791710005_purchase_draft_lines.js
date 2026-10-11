migrate((app) => {
  for (const name of ['purchasing_request_lines', 'purchasing_order_lines']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.getByName('description').required = false
    app.save(collection)
  }
}, (app) => {
  for (const name of ['purchasing_request_lines', 'purchasing_order_lines']) {
    if (app.findRecordsByFilter(name, 'description = ""', '', 1, 0).length) throw new Error('Complétez ou supprimez les lignes vides des brouillons avant de retirer cette migration.')
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.getByName('description').required = true
    app.save(collection)
  }
})
