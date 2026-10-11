migrate((app) => {
  const collection = app.findCollectionByNameOrId('documents_templates')
  collection.fields.getByName('document_type').values = ['quote', 'product_label']
  app.save(collection)
  const formats = new Collection({ name: 'documents_paper_formats', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'name', type: 'text', max: 80, required: true },
    { name: 'width_mm', type: 'number', min: 10, max: 1000, required: true }, { name: 'height_mm', type: 'number', min: 10, max: 1000, required: true },
    { name: 'active', type: 'bool' }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ], indexes: ['CREATE UNIQUE INDEX idx_document_paper_format_name ON documents_paper_formats (name COLLATE NOCASE)'] })
  app.save(formats)
  for (const paper of [{ name: 'A4', width_mm: 210, height_mm: 297 }, { name: 'Étiquette produit', width_mm: 95, height_mm: 28 }]) {
    const record = new Record(formats)
    for (const [key, value] of Object.entries({ ...paper, active: true })) record.set(key, value)
    app.save(record)
  }
}, () => { throw new Error('Restore a coherent backup to preserve published product label templates.') })
