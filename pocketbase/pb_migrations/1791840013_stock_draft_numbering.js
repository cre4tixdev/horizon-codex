migrate((app) => {
  const collection = app.findCollectionByNameOrId('inventory_operations')
  collection.fields.getByName('number').required = false
  collection.indexes = collection.indexes.filter((index) => !index.includes('idx_stock_operation_number'))
  collection.indexes.push("CREATE UNIQUE INDEX idx_stock_operation_number ON inventory_operations (number) WHERE number != ''")
  app.save(collection)
}, () => { throw new Error('Restaurer une sauvegarde cohérente : des brouillons sans numéro peuvent exister.') })
