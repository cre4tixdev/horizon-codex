migrate((app) => {
  if (app.findAllCollections().some((collection) => collection.name === 'core_notifications')) throw new Error('Notifications collection already exists; review its schema before migration.')
  const own = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && user = @request.auth.id'
  const immutable = ['user', 'type', 'title', 'body', 'source_module', 'source_entity', 'source_record_id', 'created'].map((field) => `@request.body.${field}:changed = false`).join(' && ')
  app.save(new Collection({ name: 'core_notifications', type: 'base', listRule: own, viewRule: own, createRule: null, deleteRule: null,
    updateRule: `${own} && ${immutable}`, fields: [
      { type: 'relation', name: 'user', collectionId: app.findCollectionByNameOrId('core_users').id, required: true, maxSelect: 1, cascadeDelete: false },
      ...[['type', 80], ['title', 160], ['body', 4000], ['source_module', 80], ['source_entity', 80], ['source_record_id', 15]].map(([name, max]) => ({ type: 'text', name, max, required: name === 'title' })),
      { type: 'date', name: 'read_at' }, { type: 'autodate', name: 'created', onCreate: true },
    ], indexes: ['CREATE INDEX idx_notifications_user_read ON core_notifications (user, read_at, created)'],
  }))
}, () => { throw new Error('Notifications rollback refused: preserve messages; use a corrective migration.') })
