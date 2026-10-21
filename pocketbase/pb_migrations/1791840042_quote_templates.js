migrate((app) => {
  const collection = new Collection({ name: 'sales_quote_templates', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [
    new TextField({ name: 'label', required: true, max: 120 }), new TextField({ name: 'description', max: 1000 }),
    new BoolField({ name: 'active' }), new SelectField({ name: 'currency', required: true, maxSelect: 1, values: ['EUR', 'USD', 'GBP', 'CAD', 'CHF'] }),
    new JSONField({ name: 'content', required: true, maxSize: 1048576 }),
    new RelationField({ name: 'created_by', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, required: true, cascadeDelete: false }),
    new TextField({ name: 'creation_key', required: true, max: 100 }),
    new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) collection.fields.add(field)
  collection.indexes = ['CREATE UNIQUE INDEX idx_quote_template_creation ON sales_quote_templates(created_by, creation_key)']
  app.save(collection)
}, () => { throw new Error('Conserver les modèles de devis. Utiliser une migration corrective.') })
