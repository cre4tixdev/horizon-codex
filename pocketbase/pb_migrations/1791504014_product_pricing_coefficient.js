migrate((app) => {
  const collection = app.findCollectionByNameOrId('inventory_products')
  collection.fields.add(new BoolField({ name: 'coefficient_override' }))
  collection.fields.add(new NumberField({ name: 'manual_coefficient', min: 0.000001, max: 100 }))
  app.save(collection)
  for (const product of app.findAllRecords('inventory_products')) { product.set('manual_coefficient', 1); app.save(product) }
}, () => { throw new Error('Restore a coherent backup to preserve product pricing configuration.') })
