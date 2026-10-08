migrate((app) => {
  const collection = app.findCollectionByNameOrId('settings_crm')
  collection.fields.getByName('default_view').values = ['kanban', 'list', 'last']
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('settings_crm')
  for (const record of app.findRecordsByFilter('settings_crm', 'default_view = "last"', '', 0, 0)) {
    record.set('default_view', 'kanban')
    app.save(record)
  }
  collection.fields.getByName('default_view').values = ['kanban', 'list']
  app.save(collection)
})
