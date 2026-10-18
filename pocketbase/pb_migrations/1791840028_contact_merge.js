migrate((app) => {
  for (const name of ['contacts_companies', 'contacts_people']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.add(new RelationField({ name: 'merged_into', collectionId: collection.id, maxSelect: 1, cascadeDelete: false }))
    collection.fields.add(new DateField({ name: 'merged_at' }))
    collection.indexes = [...collection.indexes, `CREATE INDEX idx_${name}_merged ON ${name}(merged_into)`]
    app.save(collection)
  }
  const references = app.findCollectionByNameOrId('core_external_references')
  references.indexes = [...references.indexes, 'CREATE INDEX idx_external_horizon_record ON core_external_references(entity_type,horizon_record_id)']; app.save(references)
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role')), rights = JSON.parse(role.getString('permissions') || '[]')
    if (!rights.includes('contacts.merge')) { role.set('permissions', [...rights, 'contacts.merge']); app.save(role) }
  }
}, () => { throw new Error('Préserver les identités fusionnées ; utiliser une migration corrective.') })
