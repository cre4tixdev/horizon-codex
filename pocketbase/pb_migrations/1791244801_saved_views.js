migrate((app) => {
  if (app.findAllCollections().some((collection) => collection.name === 'core_saved_views')) throw new Error('Saved views already exist; review the schema before migration.')
  const read = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ~ \'"contacts.read"\''
  const manage = '@request.auth.role.permissions ~ \'"core.views.manage"\''
  const visible = `(visibility = "shared" || owner = @request.auth.id || ${manage})`
  const edit = `(owner = @request.auth.id || ${manage})`
  app.save(new Collection({ name: 'core_saved_views', type: 'base',
    listRule: `${read} && ${visible}`, viewRule: `${read} && ${visible}`,
    createRule: read,
    updateRule: `${read} && ${visible} && ${edit} && @request.body.owner:changed = false && @request.body.context:changed = false`,
    deleteRule: `${read} && ${visible} && ${edit}`,
    fields: [
      { type: 'text', name: 'name', required: true, max: 80 },
      { type: 'select', name: 'context', required: true, maxSelect: 1, values: ['contacts.companies', 'contacts.people'] },
      { type: 'relation', name: 'owner', required: true, collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, cascadeDelete: false },
      { type: 'select', name: 'visibility', required: true, maxSelect: 1, values: ['personal', 'shared'] },
      { type: 'json', name: 'params', required: true, maxSize: 4000 },
      { type: 'autodate', name: 'created', onCreate: true }, { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ], indexes: ['CREATE INDEX idx_saved_views_context_owner ON core_saved_views (context, owner, visibility)'],
  }))
}, () => { throw new Error('Rollback refused: preserve saved views; use a corrective migration.') })
