migrate((app) => {
  const collection = app.findCollectionByNameOrId('core_import_jobs')
  if (!collection.fields.getByName('archived_at')) collection.fields.add(new DateField({ name: 'archived_at' }))
  collection.indexes = [...collection.indexes, 'CREATE INDEX idx_import_owner_archive ON core_import_jobs(created_by,archived_at,created)']
  app.save(collection)
}, () => { throw new Error('Conserver les imports archivés et leur historique ; utiliser une migration corrective.') })
