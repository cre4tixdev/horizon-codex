migrate((app) => {
  const rel = (name, target, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(target).id, maxSelect: 1, required, cascadeDelete: false })
  const date = (name) => ({ name, type: 'date' })
  const quotes = app.findCollectionByNameOrId('sales_quotes')
  app.save(new Collection({ name: 'sales_quote_counters', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [rel('opportunity', 'crm_opportunities', true), { name: 'last_value', type: 'number', min: 1, onlyInt: true }], indexes: ['CREATE UNIQUE INDEX idx_sales_quote_counter ON sales_quote_counters (opportunity)'] }))
  for (const quote of app.findRecordsByFilter('sales_quotes', 'id != ""', '-quote_sequence', 0, 0)) {
    if (!app.findRecordsByFilter('sales_quote_counters', 'opportunity = {:id}', '', 1, 0, { id: quote.getString('opportunity') }).length) { const counter = new Record(app.findCollectionByNameOrId('sales_quote_counters')); counter.set('opportunity', quote.getString('opportunity')); counter.set('last_value', quote.getInt('quote_sequence')); app.save(counter) }
  }
  for (const field of [rel('validated_by', 'core_users'), date('validated_at'), date('accepted_at'), date('sent_at'), date('archived_at')]) quotes.fields.add(field.type === 'relation' ? new RelationField(field) : new DateField(field))
  app.save(quotes)
  for (const quote of app.findRecordsByFilter('sales_quotes', 'status = "sent"', '', 0, 0)) { quote.set('sent_at', quote.getString('updated')); app.save(quote) }
  const orders = app.findCollectionByNameOrId('sales_orders')
  for (const field of [{ name: 'order_sequence', type: 'number', min: 1, onlyInt: true }, { name: 'customer_order_number', type: 'text', max: 120 }, rel('customer_order_event', 'core_activity_events'), rel('validated_by', 'core_users'), date('validated_at'), date('cancelled_at'), { name: 'cancellation_reason', type: 'text', max: 2000 }, { name: 'quote_snapshot', type: 'json', maxSize: 2000000 }]) orders.fields.add(field.type === 'relation' ? new RelationField(field) : field.type === 'date' ? new DateField(field) : field.type === 'number' ? new NumberField(field) : field.type === 'text' ? new TextField(field) : new JSONField(field))
  // Preserve legacy reservations of sales_orders without asserting a new quote uniqueness.
  for (const quote of app.findAllRecords('sales_quotes')) {
    let sequence = 0
    for (const order of app.findRecordsByFilter('sales_orders', 'quote = {:id}', 'created,id', 0, 0, { id: quote.id })) { order.set('order_sequence', ++sequence); app.save(order) }
  }
  orders.indexes = [...orders.indexes, 'CREATE UNIQUE INDEX idx_sales_order_sequence ON sales_orders (quote, order_sequence) WHERE quote != "" AND order_sequence > 0']
  app.save(orders)
  const read = orders.listRule
  app.save(new Collection({ name: 'sales_order_lines', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null, fields: [rel('order', 'sales_orders', true), { name: 'source_line', type: 'text', max: 15, required: true }, rel('product', 'inventory_products'), { name: 'position', type: 'number', min: 1, onlyInt: true }, { name: 'kind', type: 'select', values: ['item', 'section', 'subsection', 'subsection3', 'note'], maxSelect: 1 }, { name: 'description', type: 'text', max: 2000 }, { name: 'unit', type: 'text', max: 40 }, ...['quantity', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount'].map((name) => ({ name, type: 'number', min: 0 })), { name: 'snapshot', type: 'json', maxSize: 50000 }], indexes: ['CREATE UNIQUE INDEX idx_sales_order_line_position ON sales_order_lines ("order", position)'] }))
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role')), rights = JSON.parse(role.getString('permissions') || '[]')
    if (app.findRecordsByFilter('core_users', 'role = {:role} && erp_profile != "admin"', '', 1, 0, { role: role.id }).length) {
      const privateRole = new Record(app.findCollectionByNameOrId('core_roles')); privateRole.set('name', `sales_lifecycle_${user.id}`); privateRole.set('label', role.getString('label')); privateRole.set('active', true); privateRole.set('permissions', [...new Set([...rights, 'sales.quote.validate', 'sales.order.confirm'])]); app.save(privateRole); user.set('role', privateRole.id); app.save(user)
    } else { role.set('permissions', [...new Set([...rights, 'sales.quote.validate', 'sales.order.confirm'])]); app.save(role) }
  }
}, () => { throw new Error('Restore a coherent backup instead of deleting confirmed sales history.') })
