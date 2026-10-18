migrate((app) => {
  const collection = new Collection({ name: 'settings_table_columns', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [
    new TextField({ name: 'table_key', required: true, max: 100 }),
    new JSONField({ name: 'excluded', maxSize: 32768 }),
    new NumberField({ name: 'revision', required: true, onlyInt: true, min: 1 }),
    new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) collection.fields.add(field)
  collection.indexes = ['CREATE UNIQUE INDEX idx_settings_table_columns_key ON settings_table_columns(table_key)']
  app.save(collection)
}, () => { throw new Error('Conserver les réglages des colonnes. Utiliser une migration corrective.') })
