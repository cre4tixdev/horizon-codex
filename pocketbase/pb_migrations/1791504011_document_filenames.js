migrate((app) => {
  const collection = new Collection({ name: 'settings_document_files', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [{ name: 'key', type: 'text', required: true, pattern: '^default$' }, { name: 'patterns', type: 'json', required: true, maxSize: 3000 }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }],
    indexes: ['CREATE UNIQUE INDEX idx_document_file_settings_key ON settings_document_files (key)'],
  })
  app.save(collection)
  const record = new Record(collection)
  record.set('key', 'default')
  record.set('patterns', { quote: 'Devis_{number}', sales_order: 'Commande_{number}', purchase_order: 'Commande_achat_{number}', delivery_note: 'BL_{number}' })
  app.save(record)
}, (app) => { app.delete(app.findCollectionByNameOrId('settings_document_files')) })
