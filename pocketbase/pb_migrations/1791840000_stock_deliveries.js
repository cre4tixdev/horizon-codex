migrate((app) => {
  const settings = app.findCollectionByNameOrId('settings_stock')
  settings.fields.add(new BoolField({ name: 'auto_prepare_deliveries' })); app.save(settings)
  const operations = app.findCollectionByNameOrId('inventory_operations')
  operations.fields.add(new RelationField({ name: 'delivery_parent', collectionId: operations.id, maxSelect: 1 }))
  operations.fields.add(new JSONField({ name: 'delivery_matches', maxSize: 100000 }))
  operations.indexes.push('CREATE INDEX idx_delivery_quote_state ON inventory_operations (sales_quote, status, kind)', 'CREATE INDEX idx_receipt_order_state ON inventory_operations (purchase_order, status, kind)', 'CREATE INDEX idx_delivery_parent ON inventory_operations (delivery_parent)')
  app.save(operations)
  for (const name of ['inventory_moves', 'inventory_reservations']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.indexes.push(`CREATE INDEX idx_delivery_${name}_place ON ${name} (product, location)`); app.save(collection)
  }
}, () => { throw new Error('Restore a coherent backup: delivered quantities and backorders must remain linked.') })
