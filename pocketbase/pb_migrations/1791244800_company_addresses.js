migrate((app) => {
  const collection = app.findCollectionByNameOrId('contacts_addresses')
  if (collection.fields.getByName('email') || collection.fields.getByName('label')) throw new Error('Address fields already exist; review the schema before migration.')
  collection.fields.add(new EmailField({ name: 'email' }))
  collection.fields.add(new TextField({ name: 'label', max: 120 }))
  for (const name of ['line1', 'city', 'country']) collection.fields.getByName(name).required = false
  collection.fields.getByName('country').pattern = '^$|^[A-Z]{2}$'
  app.save(collection)
}, () => { throw new Error('Rollback refused: preserve company postal and email addresses; use a corrective migration.') })
