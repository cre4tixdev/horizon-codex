migrate((app) => {
  const lines = app.findCollectionByNameOrId('sales_quote_lines')
  for (const field of [new SelectField({ name: 'kind', values: ['item', 'section', 'subsection', 'note'], maxSelect: 1 }), new TextField({ name: 'brand', max: 160 }), new TextField({ name: 'reference', max: 160 }), new BoolField({ name: 'is_option' }), new BoolField({ name: 'show_total' }), ...['unit_cost', 'cost_total', 'section_total', 'section_options_total'].map((name) => new NumberField({ name, min: 0 })), new NumberField({ name: 'discount', min: 0, max: 100 })]) lines.fields.add(field)
  lines.fields.getByName('quantity').required = false; lines.fields.getByName('quantity').min = 0
  app.save(lines)
  app.db().newQuery("UPDATE sales_quote_lines SET kind = 'item'").execute()
  const quotes = app.findCollectionByNameOrId('sales_quotes')
  for (const name of ['options_total', 'cost_total']) quotes.fields.add(new NumberField({ name, min: 0 }))
  quotes.fields.add(new NumberField({ name: 'margin_amount' })); app.save(quotes)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const sales = `${auth} && source_module = "sales" && source_entity = "sales_quotes" && @collection.sales_quotes.id ?= source_record_id && @request.auth.role.permissions ~ '"sales.read"'`
  for (const name of ['core_activity_events', 'core_tasks']) {
    const collection = app.findCollectionByNameOrId(name)
    for (const rule of ['listRule', 'viewRule']) collection[rule] = `(${collection[rule]}) || (${sales})`
    const write = name === 'core_activity_events' ? 'createRule' : 'updateRule'
    collection[write] = `(${collection[write]}) || (${sales} && @request.auth.role.permissions ~ '"sales.write"')`
    app.save(collection)
  }
  const settings = new Collection({ name: 'settings_sales', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [{ name: 'key', type: 'text', required: true }, { name: 'column_widths', type: 'json' }, { name: 'validity_days', type: 'number', onlyInt: true, min: 1, max: 365, required: true }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }], indexes: ['CREATE UNIQUE INDEX idx_settings_sales_key ON settings_sales (key)'] })
  app.save(settings)
  const record = new Record(settings); record.set('key', 'default'); record.set('validity_days', 30); record.set('column_widths', { position: 40, description: 280, brand: 100, reference: 110, quantity: 65, unit: 60, unit_cost: 110, unit_price: 110, discount: 75, line_total: 110, purchase: 90, actions: 45 }); app.save(record)
}, () => { throw new Error('Restore a coherent backup instead of removing quote structure and history.') })
