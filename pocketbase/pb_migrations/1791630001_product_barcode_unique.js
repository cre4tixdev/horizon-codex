migrate((app) => {
  const collection = app.findCollectionByNameOrId('inventory_products')
  collection.fields.add(new TextField({ name: 'barcode_requested', max: 100, hidden: true }))
  app.save(collection)
  const products = app.findRecordsByFilter('inventory_products', 'barcode != ""', 'created,id', 0, 0)
  const reserved = new Set(products.map((product) => product.getString('barcode'))), seen = new Set()
  for (const product of products) {
    const original = product.getString('barcode'), before = product.publicExport()
    product.set('barcode_requested', original)
    if (seen.has(original)) {
      let suffix = 1, candidate
      do { const ending = String(suffix++); candidate = original.slice(0, 100 - ending.length) + ending } while (reserved.has(candidate))
      product.set('barcode', candidate); reserved.add(candidate)
      const audit = new Record(app.findCollectionByNameOrId('core_audit'))
      for (const [key, value] of Object.entries({ module: 'inventory', entity: 'inventory_products', entity_id: product.id, action: 'update', before, after: product.publicExport(), metadata: { source: 'migration', migration: '1791630001_product_barcode_unique', reason: 'duplicate_barcode' } })) audit.set(key, value)
      app.save(audit)
    }
    seen.add(original); app.save(product)
  }
  collection.indexes = [...collection.indexes, 'CREATE UNIQUE INDEX idx_inventory_product_barcode ON inventory_products (barcode) WHERE barcode != ""']
  app.save(collection)
}, () => { throw new Error('Restore a coherent backup to preserve allocated product barcodes.') })
