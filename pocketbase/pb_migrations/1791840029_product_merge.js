migrate((app) => {
  const collection = app.findCollectionByNameOrId('inventory_products')
  collection.fields.add(new RelationField({ name: 'merged_into', collectionId: collection.id, maxSelect: 1, cascadeDelete: false }))
  collection.fields.add(new DateField({ name: 'merged_at' }))
  collection.indexes = [...collection.indexes, 'CREATE INDEX idx_inventory_products_merged ON inventory_products(merged_into)']; app.save(collection)
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    let role = app.findRecordById('core_roles', user.getString('role'))
    const rights = JSON.parse(role.getString('permissions') || '[]')
    if (rights.includes('inventory.merge')) continue
    if (app.findRecordsByFilter('core_users', 'role = {:id} && erp_profile != "admin"', '', 1, 0, { id: role.id }).length) {
      const isolated = new Record(role.collection())
      for (const [key, value] of Object.entries({ name: 'merge_admin_' + user.id, label: role.getString('label'), active: role.getBool('active'), permissions: rights })) isolated.set(key, value)
      app.save(isolated); role = isolated; user.set('role', role.id); app.save(user)
    }
    role.set('permissions', [...rights, 'inventory.merge']); app.save(role)
  }
}, () => { throw new Error('Préserver les anciennes identités produit ; utiliser une migration corrective.') })
