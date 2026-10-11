migrate((app) => {
  const text = (name, max = 200, required = false) => ({ name, type: 'text', max, required })
  const rel = (name, collection) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1 })
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const create = (name, fields, indexes = []) => { const collection = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [...fields, ...dates], indexes }); app.save(collection); return collection }
  const warehouses = app.findCollectionByNameOrId('inventory_warehouses')
  warehouses.fields.add(new TextField({ name: 'trigram', min: 3, max: 3, required: false }))
  warehouses.fields.add(new JSONField({ name: 'counters', maxSize: 10000 }))
  app.save(warehouses)
  for (const warehouse of app.findAllRecords('inventory_warehouses')) {
    const code = warehouse.getString('code').toUpperCase().replace(/[^A-Z]/g, '')
    warehouse.set('trigram', code === 'CVS' ? 'MEU' : (code + 'XXX').slice(0, 3)); warehouse.set('counters', {})
    if (code === 'CVS') warehouse.set('name', 'Meudon (CVS)')
    app.save(warehouse)
  }
  warehouses.fields.getByName('trigram').required = true
  warehouses.indexes.push('CREATE UNIQUE INDEX idx_warehouse_trigram ON inventory_warehouses (trigram)'); app.save(warehouses)
  if (!app.findRecordsByFilter('inventory_warehouses', 'trigram = "SEV"', '', 1, 0).length) {
    const warehouse = new Record(warehouses); warehouse.set('code', 'SEV'); warehouse.set('trigram', 'SEV'); warehouse.set('name', 'Sèvres'); warehouse.set('active', true); warehouse.set('counters', {}); app.save(warehouse)
    const location = new Record(app.findCollectionByNameOrId('inventory_locations')); location.set('warehouse', warehouse.id); location.set('code', 'STOCK'); location.set('name', 'Stock principal'); location.set('active', true); app.save(location)
  }
  create('settings_stock', [{ name: 'lock_inventory', type: 'bool' }])
  const settings = new Record(app.findCollectionByNameOrId('settings_stock')); settings.set('lock_inventory', true); app.save(settings)
  create('inventory_operations', [text('number', 80, true), text('title', 200), { name: 'kind', type: 'select', values: ['IN', 'OUT', 'RET', 'PREP', 'INT', 'INV'], maxSelect: 1, required: true }, { name: 'status', type: 'select', values: ['draft', 'counting', 'transit', 'done', 'cancelled'], maxSelect: 1, required: true }, rel('warehouse', 'inventory_warehouses'), rel('destination_warehouse', 'inventory_warehouses'), rel('opportunity', 'crm_opportunities'), rel('purchase_order', 'purchasing_orders'), rel('sales_quote', 'sales_quotes'), text('destination', 1000), text('reason', 2000), text('notes', 10000), { name: 'document_snapshot', type: 'json', maxSize: 1000000 }, text('document_date', 10), text('planned_date', 10), { name: 'inventory_mode', type: 'select', values: ['annual', 'cycle'], maxSelect: 1 }, { name: 'dropship', type: 'bool' }, { name: 'scrap', type: 'bool' }, { name: 'lock_movements', type: 'bool' }, { name: 'scope', type: 'json', maxSize: 100000 }, { name: 'lines', type: 'json', maxSize: 2000000 }, rel('actor', 'core_users'), rel('validated_by', 'core_users'), { name: 'validated_at', type: 'date' }, { name: 'archived_at', type: 'date' }, { ...text('creation_key', 100, true), hidden: true }, { ...text('creation_hash', 64), hidden: true }], ['CREATE UNIQUE INDEX idx_stock_operation_number ON inventory_operations (number)', 'CREATE UNIQUE INDEX idx_stock_operation_key ON inventory_operations (creation_key)', 'CREATE INDEX idx_stock_operation_state ON inventory_operations (kind,status,warehouse)'])
  const operations = app.findCollectionByNameOrId('inventory_operations'); operations.fields.add(new RelationField(rel('origin', 'inventory_operations'))); app.save(operations)
  const moves = app.findCollectionByNameOrId('inventory_moves'); moves.fields.add(new RelationField({ ...rel('operation', 'inventory_operations') })); moves.fields.add(new RelationField({ ...rel('analytic_account', 'accounting_analytic_accounts') })); moves.fields.add(new TextField(text('source_line', 15))); app.save(moves)
  const templates = app.findCollectionByNameOrId('documents_templates'); templates.fields.getByName('document_type').values.push('stock_operation'); app.save(templates)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  for (const name of ['core_activity_events', 'core_tasks']) { const collection = app.findCollectionByNameOrId(name); collection.listRule = `(${collection.listRule}) || (${auth} && source_module = "inventory" && @request.auth.role.permissions ~ '"inventory.read"' && source_entity = "inventory_operations" && @collection.inventory_operations.id ?= source_record_id)`; collection.viewRule = collection.listRule; app.save(collection) }
  // Validation is a separate business permission; never grant it to a read-only profile.
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    let role = app.findRecordById('core_roles', user.getString('role'))
    if (app.findRecordsByFilter('core_users', 'role = {:role} && erp_profile != "admin"', '', 1, 0, { role: role.id }).length) { const copy = new Record(role.collection()); copy.set('name', `stock_${user.id}`); copy.set('label', role.getString('label')); copy.set('active', true); copy.set('permissions', JSON.parse(role.getString('permissions') || '[]')); app.save(copy); role = copy; user.set('role', role.id) }
    role.set('permissions', [...new Set([...JSON.parse(role.getString('permissions') || '[]'), 'inventory.read', 'inventory.write', 'inventory.stock.validate'])]); app.save(role)
    const grants = JSON.parse(user.getString('access_grants') || '{}') || {}; if (grants.inventory) { grants.inventory.actions = [...new Set([...grants.inventory.actions, 'stock.validate'])]; user.set('access_grants', grants) }; app.save(user)
  }
}, () => { throw new Error('Restore a coherent backup: stock operations and their ledger must remain linked.') })
