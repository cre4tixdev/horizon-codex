migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const collection = new Collection({ name: 'settings_identity_tags', type: 'base',
    listRule: auth, viewRule: auth, createRule: null, deleteRule: null,
    updateRule: `${auth} && (@request.auth.erp_profile = "admin" || @request.auth.erp_profile = "superuser") && @request.auth.role.permissions ~ '"settings.references"'`,
    fields: [
      { name: 'code', type: 'text', required: true, pattern: '^(admin|superuser|user|viewer|direction|manager|collaborator)$' },
      { name: 'label', type: 'text', required: true, max: 120 },
      { name: 'sort_order', type: 'number', required: true, min: 1, onlyInt: true },
      { name: 'active', type: 'bool' },
      { name: 'tone', type: 'select', required: true, maxSelect: 1, values: ['blue', 'violet', 'pink', 'green', 'amber', 'navy'] },
      { name: 'color', type: 'text', max: 7, pattern: '^#[0-9a-fA-F]{6}$' },
      { name: 'created', type: 'autodate', onCreate: true },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ], indexes: ['CREATE UNIQUE INDEX idx_settings_identity_tags_code ON settings_identity_tags (code)'],
  })
  app.save(collection)
  const defaults = [['admin', 'Admin', 'navy'], ['superuser', 'Superuser', 'violet'], ['user', 'User', 'blue'], ['viewer', 'Viewer', 'blue'], ['direction', 'Direction', 'navy'], ['manager', 'Manager', 'violet'], ['collaborator', 'Collaborateur', 'blue']]
  defaults.forEach(([code, label, tone], index) => {
    const record = new Record(collection)
    for (const [key, value] of Object.entries({ code, label, tone, sort_order: index + 1, active: true })) record.set(key, value)
    app.save(record)
  })
}, (app) => { app.delete(app.findCollectionByNameOrId('settings_identity_tags')) })
