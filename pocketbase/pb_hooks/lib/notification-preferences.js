const types = ['mentions', 'tasks', 'email_replies', 'leave_requests', 'leave_updates', 'expense_requests', 'expense_updates', 'time_requests', 'time_updates', 'other_activity']
const current = (e) => {
  if (!e.auth || e.auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = e.app.findRecordById('core_users', e.auth.id)
  if (!user.getBool('active') || !e.app.findRecordById('core_roles', user.getString('role')).getBool('active')) throw new ForbiddenError('Compte indisponible.')
  return user
}
const rows = (app, user) => app.findRecordsByFilter('core_notification_preferences', 'user = {:user}', 'event_type,id', 100, 0, { user })
const dto = (app, user) => {
  const saved = rows(app, user)
  return { version: $security.sha256(JSON.stringify(saved.map((r) => [r.id, r.getString('updated'), r.getBool('in_app')]))), items: types.map((type) => ({ event_type: type, in_app: saved.find((r) => r.getString('event_type') === type)?.getBool('in_app') ?? true })) }
}
module.exports = { types, current,
  enabled(app, user, type) {
    if (!types.includes(type)) throw new Error('Unknown notification preference type.')
    const saved = app.findRecordsByFilter('core_notification_preferences', 'user = {:user} && event_type = {:type}', '', 1, 0, { user, type })
    return !saved.length || saved[0].getBool('in_app')
  },
  read(e) { const user = current(e); return e.json(200, dto(e.app, user.id)) },
  save(e) {
    const user = current(e), b = e.requestInfo().body
    if (Object.keys(b).some((k) => !['version', 'items'].includes(k)) || typeof b.version !== 'string' || !Array.isArray(b.items) || b.items.length !== types.length || new Set(b.items.map((v) => v?.event_type)).size !== types.length || b.items.some((v) => !v || Object.keys(v).length !== 2 || !types.includes(v.event_type) || typeof v.in_app !== 'boolean')) throw new BadRequestError('Préférences de notifications invalides.')
    let saved
    e.app.runInTransaction((app) => {
      current({ app, auth: e.auth })
      const before = dto(app, user.id)
      if (before.version !== b.version) throw new ApiError(409, 'Vos préférences ont changé. Rechargez-les avant d’enregistrer.')
      const existing = rows(app, user.id), collection = app.findCollectionByNameOrId('core_notification_preferences')
      for (const input of b.items) {
        const record = existing.find((r) => r.getString('event_type') === input.event_type) || new Record(collection)
        record.set('user', user.id); record.set('event_type', input.event_type); record.set('in_app', input.in_app); record.set('email', false); app.save(record)
      }
      saved = dto(app, user.id)
      require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_notification_preferences', user.id, user.id, before, saved, 'preferences_update')
    })
    return e.json(200, saved)
  },
}
