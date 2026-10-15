migrate((app) => {
  const orders = app.findCollectionByNameOrId('sales_orders')
  const revisions = new Collection({ name: 'sales_order_revisions', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [], indexes: [] })
  for (const field of [
    new RelationField({ name: 'order', collectionId: orders.id, required: true, maxSelect: 1, cascadeDelete: false }),
    new NumberField({ name: 'number', min: 1, onlyInt: true, required: true }),
    new SelectField({ name: 'status', values: ['draft', 'validated'], maxSelect: 1, required: true }),
    new RelationField({ name: 'actor', collectionId: app.findCollectionByNameOrId('core_users').id, required: true, maxSelect: 1, cascadeDelete: false }),
    new JSONField({ name: 'before_snapshot', maxSize: 5000000 }),
    new JSONField({ name: 'after_snapshot', maxSize: 5000000 }),
    new JSONField({ name: 'changes', maxSize: 1000000 }),
    new JSONField({ name: 'impacts', maxSize: 1000000 }),
    new AutodateField({ name: 'created', onCreate: true }),
    new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) revisions.fields.add(field)
  revisions.indexes = ['CREATE UNIQUE INDEX idx_sales_order_revision_number ON sales_order_revisions ("order", number)']
  app.save(revisions)
  orders.fields.add(new RelationField({ name: 'current_revision', collectionId: revisions.id, maxSelect: 1, cascadeDelete: false }))
  orders.fields.add(new NumberField({ name: 'revision_number', min: 0, onlyInt: true }))
  app.save(orders)
  const lines = app.findCollectionByNameOrId('sales_order_lines')
  lines.indexes = lines.indexes.filter((index) => !index.includes('idx_sales_order_line_position'))
  lines.indexes.push('CREATE INDEX idx_sales_order_line_position ON sales_order_lines ("order", position, id)')
  app.save(lines)
}, () => { throw new Error('Restore a coherent backup: customer order revisions must be preserved.') })
