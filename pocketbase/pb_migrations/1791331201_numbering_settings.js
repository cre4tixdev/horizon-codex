migrate((app) => {
  const collection = app.findCollectionByNameOrId('settings_numbering_sequences')
  collection.fields.add(new NumberField({ name: 'start_value', min: 1, max: 999999999998, onlyInt: true }))
  collection.fields.add(new BoolField({ name: 'has_issued' }))
  const permission = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ~ \'"settings.references"\''
  collection.listRule = permission; collection.viewRule = permission
  app.save(collection)
  for (const record of app.findAllRecords(collection)) {
    record.set('start_value', 1)
    record.set('has_issued', record.getInt('next_value') > 1 || record.getString('entity_type') === 'crm_opportunities' && app.findRecordsByFilter('crm_opportunities', '', '', 1, 0).length > 0)
    app.save(record)
  }
}, () => { throw new Error('Numbering settings rollback refused: preserve sequence history.') })
