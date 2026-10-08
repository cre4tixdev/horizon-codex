migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const collection = new Collection({ name: 'crm_appointment_kinds', type: 'base',
    listRule: `${auth} && (@request.auth.role.permissions ~ '"crm.read"' || @request.auth.role.permissions ~ '"settings.references"')`, viewRule: `${auth} && (@request.auth.role.permissions ~ '"crm.read"' || @request.auth.role.permissions ~ '"settings.references"')`, createRule: null, deleteRule: null,
    updateRule: `${auth} && (@request.auth.erp_profile = "admin" || @request.auth.erp_profile = "superuser") && @request.auth.role.permissions ~ '"settings.references"'`,
    fields: [
      { name: 'code', type: 'text', required: true, pattern: '^(visit|hearing)$' },
      { name: 'label', type: 'text', required: true, max: 120 },
      { name: 'sort_order', type: 'number', required: true, min: 1, onlyInt: true },
      { name: 'active', type: 'bool' },
      { name: 'tone', type: 'select', required: true, maxSelect: 1, values: ['blue', 'violet', 'pink', 'green', 'amber', 'navy'] },
      { name: 'color', type: 'text', max: 7, pattern: '^#[0-9a-fA-F]{6}$' },
      { name: 'created', type: 'autodate', onCreate: true },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ], indexes: ['CREATE UNIQUE INDEX idx_crm_appointment_kinds_code ON crm_appointment_kinds (code)'],
  })
  app.save(collection)
  const defaults = [['visit', 'Visite', 'blue'], ['hearing', 'Soutenance', 'violet']]
  defaults.forEach(([code, label, tone], index) => {
    const record = new Record(collection)
    for (const [key, value] of Object.entries({ code, label, tone, sort_order: index + 1, active: true })) record.set(key, value)
    app.save(record)
  })
}, (app) => { app.delete(app.findCollectionByNameOrId('crm_appointment_kinds')) })
