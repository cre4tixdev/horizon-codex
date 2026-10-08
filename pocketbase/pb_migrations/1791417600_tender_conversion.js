migrate((app) => {
  const collection = app.findCollectionByNameOrId('crm_tenders')
  collection.fields.add(new DateField({ name: 'archived_at' }))
  app.save(collection)
}, (app) => {
  if (app.findRecordsByFilter('crm_tenders', 'archived_at != ""', '', 1).length) throw new Error('Rollback refused: archived tender history exists.')
  const collection = app.findCollectionByNameOrId('crm_tenders')
  collection.fields.removeByName('archived_at')
  app.save(collection)
})
