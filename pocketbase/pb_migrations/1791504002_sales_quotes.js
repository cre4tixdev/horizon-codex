migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const read = `${auth} && @request.auth.role.permissions ~ '"sales.read"'`
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const text = (name, max, required = false, hidden = false) => ({ name, type: 'text', max, required, hidden })
  const rel = (name, collection, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(collection).id, maxSelect: 1, required, cascadeDelete: false })
  const money = (name) => ({ name, type: 'number', min: 0 })
  const common = [rel('opportunity', 'crm_opportunities', true), rel('analytic_account', 'accounting_analytic_accounts', true), rel('company', 'contacts_companies', true), rel('contact', 'contacts_people'), rel('owner', 'core_users', true), text('currency', 3, true), money('exchange_rate'), money('subtotal'), money('tax'), money('total')]
  const quotes = new Collection({ name: 'sales_quotes', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null, fields: [text('quote_number', 100, true), { name: 'quote_sequence', type: 'number', min: 1, onlyInt: true, required: true }, { name: 'revision', type: 'number', min: 1, onlyInt: true }, text('title', 200, true), text('notes', 10000), { name: 'status', type: 'select', values: ['draft', 'validated', 'sent', 'accepted', 'rejected', 'cancelled'], maxSelect: 1, required: true }, { name: 'quote_date', type: 'date' }, { name: 'valid_until', type: 'date' }, text('lost_reason', 2000), { name: 'cancelled_at', type: 'date' }, text('creation_key', 100, true, true), rel('created_by', 'core_users', true), ...common, ...dates], indexes: ['CREATE UNIQUE INDEX idx_sales_quote_number ON sales_quotes (quote_number)', 'CREATE UNIQUE INDEX idx_sales_quote_sequence ON sales_quotes (opportunity, quote_sequence)', 'CREATE UNIQUE INDEX idx_sales_quote_creation ON sales_quotes (created_by, creation_key)'] })
  quotes.fields.getByName('created_by').hidden = true
  app.save(quotes)
  app.save(new Collection({ name: 'sales_quote_lines', type: 'base', listRule: `${read} && quote.id != ""`, viewRule: `${read} && quote.id != ""`, createRule: null, updateRule: null, deleteRule: null, fields: [rel('quote', 'sales_quotes', true), { name: 'position', type: 'number', min: 1, onlyInt: true }, text('description', 2000, true), text('unit', 40), { name: 'quantity', type: 'number', min: 0.001, required: true }, money('unit_price'), money('line_total'), text('price_source', 35), ...dates] }))
  app.save(new Collection({ name: 'sales_orders', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null, fields: [text('order_number', 100, true), rel('quote', 'sales_quotes'), { name: 'status', type: 'select', values: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'], maxSelect: 1, required: true }, { name: 'order_date', type: 'date' }, ...common, ...dates], indexes: ['CREATE UNIQUE INDEX idx_sales_order_number ON sales_orders (order_number)'] }))
  // Admins gain the newly delivered module; business users keep explicit grants.
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role'))
    const rights = JSON.parse(role.getString('permissions') || '[]')
    role.set('permissions', [...new Set([...rights, 'sales.read', 'sales.write'])]); app.save(role)
  }
}, () => { throw new Error('Restore a coherent backup instead of deleting historical sales documents.') })
