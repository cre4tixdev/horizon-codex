migrate((app) => {
  const collection = app.findCollectionByNameOrId('inventory_warehouses')
  const warehouses = app.findAllRecords('inventory_warehouses')
  // Stage unique temporary codes so legacy codes cannot collide with another
  // warehouse's final code. Keep identities, counters and issued pieces intact.
  for (const warehouse of warehouses) {
    warehouse.set('code', `migration-${warehouse.id}`)
    app.save(warehouse)
  }
  for (const warehouse of warehouses) {
    warehouse.set('code', warehouse.getString('trigram'))
    app.save(warehouse)
  }
  collection.indexes = collection.indexes.filter((index) => !index.includes('idx_warehouse_trigram'))
  collection.fields.removeByName('trigram')
  const code = collection.fields.getByName('code')
  code.min = 3
  code.max = 3
  code.pattern = '^[A-Z]{3}$'
  app.save(collection)
}, () => { throw new Error('Restore a coherent backup: warehouse codes and issued numbers must remain linked.') })
