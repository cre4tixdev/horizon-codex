migrate((app) => {
  const collection = new Collection({ name: 'core_display_preferences', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [
    new RelationField({ name: 'user', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, required: true, cascadeDelete: false }),
    new JSONField({ name: 'preference', required: true, maxSize: 1024 }),
    new NumberField({ name: 'revision', required: true, onlyInt: true, min: 1 }),
    new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) collection.fields.add(field)
  collection.indexes = ['CREATE UNIQUE INDEX idx_display_preference_user ON core_display_preferences(user)']
  app.save(collection)
}, () => { throw new Error('Conserver les préférences personnelles. Utiliser une migration corrective.') })
