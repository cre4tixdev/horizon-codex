migrate((app) => {
  const vehicles = new Collection({
    name: 'expenses_vehicles', type: 'base',
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [], indexes: [],
  })
  for (const field of [
    new TextField({ name: 'brand', max: 60, required: true }),
    new TextField({ name: 'model', max: 80, required: true }),
    new TextField({ name: 'registration', max: 30, required: true }),
    new RelationField({ name: 'employee', collectionId: app.findCollectionByNameOrId('hr_employees').id, maxSelect: 1, required: true, cascadeDelete: false }),
    new BoolField({ name: 'active' }),
    new AutodateField({ name: 'created', onCreate: true }),
    new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) vehicles.fields.add(field)
  vehicles.indexes = ['CREATE UNIQUE INDEX idx_expenses_vehicle_registration ON expenses_vehicles(registration)', 'CREATE INDEX idx_expenses_vehicle_employee ON expenses_vehicles(employee,active)']
  app.save(vehicles)
  const lines = app.findCollectionByNameOrId('expenses_lines')
  lines.fields.add(new RelationField({ name: 'vehicle_record', collectionId: vehicles.id, maxSelect: 1, cascadeDelete: false }))
  app.save(lines)
}, () => { throw new Error('Vehicle references and expense history must be preserved: restore a coherent backup.') })
