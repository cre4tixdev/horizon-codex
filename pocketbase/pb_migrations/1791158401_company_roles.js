migrate((app) => {
  const unsupported = app.findAllRecords('contacts_company_roles').filter((record) => !['customer', 'supplier'].includes(record.getString('role')))
  if (unsupported.length) throw new Error('Company role migration refused: historical roles need an explicit decision; no records were deleted.')
  const collection = app.findCollectionByNameOrId('contacts_company_roles')
  collection.fields.getByName('role').values = ['customer', 'supplier']
  app.save(collection)
}, () => { throw new Error('Rollback refused: use a corrective migration to keep company role rules consistent.') })
