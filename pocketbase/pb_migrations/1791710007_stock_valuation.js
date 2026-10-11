migrate((app) => {
  const settings = app.findCollectionByNameOrId('settings_stock')
  settings.fields.add(new SelectField({ name: 'valuation_method', values: ['standard', 'cump', 'fifo'], maxSelect: 1 }))
  app.save(settings)
  for (const record of app.findAllRecords('settings_stock')) { record.set('valuation_method', 'standard'); app.save(record) }
  const rel = (name, target) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(target).id, maxSelect: 1 })
  const num = (name) => ({ name, type: 'number' })
  const text = (name, max = 100) => ({ name, type: 'text', max })
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const create = (name, fields, indexes) => app.save(new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [...fields, ...dates], indexes }))
  create('inventory_valuation_products', [rel('product', 'inventory_products'), num('standard_cost'), { name: 'layers', type: 'json', maxSize: 2000000 }], ['CREATE UNIQUE INDEX idx_valuation_product ON inventory_valuation_products (product)'])
  create('inventory_valuation_entries', [rel('product', 'inventory_products'), rel('move', 'inventory_moves'), rel('operation', 'inventory_operations'), rel('actor', 'core_users'), text('method', 20), text('currency', 3), text('location', 100), num('quantity'), num('movement_value'), num('value_delta'), num('actual_value'), num('variance'), { name: 'actual_known', type: 'bool' }, text('reason', 2000), text('entry_key', 200), { name: 'snapshot', type: 'json', maxSize: 2000000 }], ['CREATE UNIQUE INDEX idx_valuation_entry_key ON inventory_valuation_entries (entry_key)', 'CREATE INDEX idx_valuation_entry_product ON inventory_valuation_entries (product,created)'])
}, () => { throw new Error('Restore a coherent backup: valuation history must be retained.') })
