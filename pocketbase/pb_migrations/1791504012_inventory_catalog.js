migrate((app) => {
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const text = (name, max = 160, required = false) => ({ name, type: 'text', max, required })
  const number = (name, max = 1000000000, min = 0) => ({ name, type: 'number', min, max })
  const select = (name, values) => ({ name, type: 'select', values, maxSelect: 1, required: true })
  const relation = (name, collection, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1, cascadeDelete: false, required })
  const locked = { listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null }
  const create = (name, fields, indexes = []) => { const collection = new Collection({ name, type: 'base', ...locked, fields: [...fields, ...dates], indexes }); app.save(collection); return collection }
  const categories = create('inventory_product_categories', [text('code', 40, true), text('label', 120, true), number('coefficient', 100, 0.000001), { name: 'active', type: 'bool' }], ['CREATE UNIQUE INDEX idx_product_category_code ON inventory_product_categories (code)'])
  for (const [code, label, coefficient] of [['equipment', 'Équipements', 1.2], ['supplies', 'Fournitures', 1.35], ['services', 'Services', 1]]) { const record = new Record(categories); for (const [key, value] of Object.entries({ code, label, coefficient, active: true })) record.set(key, value); app.save(record) }
  const products = create('inventory_products', [text('sku', 80, true), text('name', 200, true), text('description', 2000), relation('category', categories.name, true), select('kind', ['equipment', 'consumable', 'service']), select('composition_mode', ['none']), { name: 'sale_enabled', type: 'bool' }, { name: 'purchase_enabled', type: 'bool' }, select('stock_policy', ['none', 'stocked', 'on_demand']), select('replenishment_policy', ['manual', 'on_demand', 'min_max']), select('tracking', ['none', 'lot', 'serial']), relation('base_unit', 'inventory_units', true), relation('sale_unit', 'inventory_units', true), text('manufacturer'), text('manufacturer_ref'), text('barcode', 100), text('variant_group', 120), number('reference_cost'), text('sale_currency', 3, true), { name: 'active', type: 'bool' }, { ...text('creation_key', 100, true), hidden: true }, relation('created_by', 'core_users', true), ...['primary_image', 'images'].map((name) => ({ name, type: 'file', protected: true, maxSelect: name === 'images' ? 6 : 1, maxSize: 5000000, mimeTypes: ['image/png', 'image/jpeg', 'image/webp'] }))], ['CREATE UNIQUE INDEX idx_inventory_product_sku ON inventory_products (sku)', 'CREATE UNIQUE INDEX idx_inventory_product_creation ON inventory_products (creation_key)'])
  products.viewRule = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ~ \'"inventory.read"\''
  app.save(products)
  create('inventory_product_suppliers', [relation('product', products.name, true), relation('supplier', 'contacts_companies', true), text('supplier_sku'), number('list_price'), number('discount', 100), number('purchase_price'), number('purchase_quantity', 1000000, 0.000001), text('currency', 3, true), number('lead_time_days', 3650), { name: 'valid_from', type: 'date' }, { name: 'valid_until', type: 'date' }, { name: 'is_preferred', type: 'bool' }, { name: 'active', type: 'bool' }], ['CREATE UNIQUE INDEX idx_inventory_product_favorite ON inventory_product_suppliers (product) WHERE is_preferred = 1 AND active = 1'])
  create('inventory_supplier_price_history', [relation('product_supplier', 'inventory_product_suppliers', true), number('price'), text('currency', 3, true), { name: 'snapshot', type: 'json', maxSize: 10000 }, { name: 'effective_at', type: 'date', required: true }, relation('actor', 'core_users', true)])
  const lines = app.findCollectionByNameOrId('sales_quote_lines')
  lines.fields.add(new RelationField(relation('product', products.name)))
  lines.fields.add(new RelationField(relation('product_supplier', 'inventory_product_suppliers')))
  lines.fields.add(new JSONField({ name: 'catalog_snapshot', maxSize: 10000 }))
  app.save(lines)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const inventory = `${auth} && source_module = "inventory" && source_entity = "inventory_products" && @collection.inventory_products.id ?= source_record_id && @request.auth.role.permissions ~ '"inventory.read"'`
  for (const name of ['core_activity_events', 'core_tasks']) {
    const collection = app.findCollectionByNameOrId(name)
    for (const rule of ['listRule', 'viewRule']) collection[rule] = `(${collection[rule]}) || (${inventory})`
    const write = name === 'core_activity_events' ? 'createRule' : 'updateRule'
    collection[write] = `(${collection[write]}) || (${inventory} && @request.auth.role.permissions ~ '"inventory.write"')`
    app.save(collection)
  }
  const notifications = app.findCollectionByNameOrId('core_notifications')
  const own = `${inventory} && user = @request.auth.id && type = "activity"`
  for (const rule of ['listRule', 'viewRule']) notifications[rule] = `(${notifications[rule]}) || (${own})`
  notifications.updateRule = `(${notifications.updateRule}) || (${own} && @request.body.user:changed = false && @request.body.type:changed = false && @request.body.title:changed = false && @request.body.body:changed = false && @request.body.source_module:changed = false && @request.body.source_entity:changed = false && @request.body.source_record_id:changed = false && @request.body.activity_event:changed = false && @request.body.created:changed = false)`
  app.save(notifications)
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    let role = app.findRecordById('core_roles', user.getString('role'))
    if (app.findRecordsByFilter('core_users', 'role = {:id} && erp_profile != "admin"', '', 1, 0, { id: role.id }).length) { const isolated = new Record(role.collection()); for (const [key, value] of Object.entries({ name: 'catalog_admin_' + user.id, label: role.getString('label'), active: role.getBool('active'), permissions: JSON.parse(role.getString('permissions') || '[]') })) isolated.set(key, value); app.save(isolated); role = isolated; user.set('role', role.id); app.save(user) }
    role.set('permissions', [...new Set([...JSON.parse(role.getString('permissions') || '[]'), 'inventory.read', 'inventory.write'])]); app.save(role)
    const grants = JSON.parse(user.getString('access_grants') || '{}') || {}; if (Object.keys(grants).length) { grants.inventory = { actions: ['read', 'write'], scope: 'all' }; user.set('access_grants', grants); app.save(user) }
  }
}, () => { throw new Error('Restore a coherent backup to retain product price and quote history.') })
