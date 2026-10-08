migrate((app) => {
  const quotes = app.findCollectionByNameOrId('sales_quotes')
  quotes.fields.add(new SelectField({ name: 'discount_mode', values: ['percent', 'amount'], maxSelect: 1 }))
  quotes.fields.getByName('discount').max = 1000000000
  quotes.fields.add(new TextField({ name: 'terms_id', max: 100 }))
  quotes.fields.add(new TextField({ name: 'terms_label', max: 120 }))
  quotes.fields.add(new TextField({ name: 'terms_content', max: 20000 }))
  app.save(quotes)
  app.db().newQuery("UPDATE sales_quotes SET discount_mode = 'percent'").execute()
  const settings = app.findCollectionByNameOrId('settings_sales')
  settings.fields.add(new JSONField({ name: 'terms', maxSize: 4194304 })); app.save(settings)
  const audit = app.findCollectionByNameOrId('core_audit')
  for (const name of ['before', 'after']) audit.fields.getByName(name).maxSize = 4194304
  app.save(audit)
  const defaults = app.findFirstRecordByData('settings_sales', 'key', 'default'); defaults.set('terms', []); app.save(defaults)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const admin = app.findCollectionByNameOrId('settings_countries')
  const units = new Collection({ name: 'inventory_units', type: 'base', listRule: `${auth} && (@request.auth.role.permissions ~ '"sales.read"' || @request.auth.role.permissions ~ '"settings.references"')`, viewRule: `${auth} && (@request.auth.role.permissions ~ '"sales.read"' || @request.auth.role.permissions ~ '"settings.references"')`, createRule: admin.createRule, updateRule: admin.updateRule, deleteRule: null, fields: [{ name: 'code', type: 'text', required: true, max: 40 }, { name: 'label', type: 'text', required: true, max: 120 }, { name: 'active', type: 'bool' }, { name: 'sort_order', type: 'number', min: 0, onlyInt: true }, { name: 'category', type: 'text', max: 40 }, { name: 'ratio_to_base', type: 'number', min: 0 }, { name: 'rounding', type: 'number', min: 0 }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }], indexes: ['CREATE UNIQUE INDEX idx_inventory_unit_code ON inventory_units (code)'] })
  app.save(units)
  const values = new Map([['u', 'Unité'], ['h', 'Heure'], ['j', 'Jour'], ['m', 'Mètre']])
  for (const line of app.findAllRecords('sales_quote_lines')) { const code = line.getString('unit').trim(); if (code && !values.has(code)) values.set(code, code) }
  let order = 0
  for (const [code, label] of values) { const unit = new Record(units); for (const [key, value] of Object.entries({ code, label, active: true, sort_order: order++, ratio_to_base: 1, rounding: 0.001 })) unit.set(key, value); app.save(unit) }
}, () => { throw new Error('Restore a coherent backup instead of removing units and quote terms snapshots.') })
