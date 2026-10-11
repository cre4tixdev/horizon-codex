migrate((app) => {
  const read = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ?= "calendar.read" && (owner = @request.auth.id || visibility = "team")'
  app.save(new Collection({ name: 'calendar_events', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'title', type: 'text', required: true, max: 200 }, { name: 'description', type: 'text', max: 5000 },
    { name: 'start', type: 'date', required: true }, { name: 'end', type: 'date' }, { name: 'all_day', type: 'bool' },
    { name: 'timezone', type: 'text', required: true }, { name: 'location', type: 'text', max: 500 },
    { name: 'owner', type: 'relation', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, required: true },
    { name: 'visibility', type: 'select', values: ['private', 'team'], maxSelect: 1, required: true },
    { name: 'tone', type: 'select', values: ['blue', 'violet', 'pink', 'green', 'amber', 'navy'], maxSelect: 1, required: true },
    { name: 'color', type: 'text', max: 7 }, { name: 'archived', type: 'bool' }, { name: 'creation_key', type: 'text', required: true, max: 100 },
    { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ], indexes: ['CREATE UNIQUE INDEX idx_calendar_creation ON calendar_events (owner, creation_key)', 'CREATE INDEX idx_calendar_dates ON calendar_events (start, end)'] }))
  for (const role of app.findAllRecords('core_roles')) {
    const permissions = JSON.parse(role.getString('permissions') || '[]')
    const next = [...new Set([...permissions, 'calendar.read', ...(permissions.some((right) => right.endsWith('.write') || right === 'settings.users') ? ['calendar.write'] : [])])]
    role.set('permissions', next); app.save(role)
  }
}, (app) => {
  app.delete(app.findCollectionByNameOrId('calendar_events'))
  for (const role of app.findAllRecords('core_roles')) { role.set('permissions', JSON.parse(role.getString('permissions') || '[]').filter((right) => !right.startsWith('calendar.'))); app.save(role) }
})
