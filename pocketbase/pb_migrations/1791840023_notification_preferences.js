migrate((app) => {
  const notifications = app.findCollectionByNameOrId('core_notifications')
  notifications.fields.add(new DateField({ name: 'dismissed_at' }))
  notifications.fields.add(new TextField({ name: 'event_type', max: 80 }))
  notifications.updateRule = `(${notifications.updateRule}) && @request.body.dismissed_at:changed = false && @request.body.event_type:changed = false`
  notifications.indexes.push('CREATE INDEX idx_notifications_inbox ON core_notifications(user, dismissed_at, read_at, created)')
  app.save(notifications)
  const own = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && user = @request.auth.id'
  const preferences = new Collection({ name: 'core_notification_preferences', type: 'base', listRule: own, viewRule: own, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [
    new RelationField({ name: 'user', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, required: true, cascadeDelete: false }),
    new SelectField({ name: 'event_type', required: true, maxSelect: 1, values: ['mentions', 'tasks', 'email_replies', 'leave_requests', 'leave_updates', 'expense_requests', 'expense_updates', 'other_activity'] }),
    new BoolField({ name: 'in_app' }), new BoolField({ name: 'email' }),
    new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  ]) preferences.fields.add(field)
  preferences.indexes = ['CREATE UNIQUE INDEX idx_notification_preference ON core_notification_preferences(user, event_type)']
  app.save(preferences)
}, () => { throw new Error('Conserver les préférences et notifications. Utiliser une migration corrective.') })
