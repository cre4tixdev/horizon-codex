const policy = require(`${__hooks}/lib/access-policy.js`)
const current = (app, auth) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id)
  if (!user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active')) throw new ForbiddenError('Compte indisponible.')
  return user
}
const row = (app, user) => app.findRecordsByFilter('core_display_preferences', 'user = {:user}', '', 1, 0, { user })[0]
const defaults = { showCounters: true, highlightNonZero: true, theme: 'default', searchWidth: null, sidebarWidth: null, density: 'default' }
const dto = (record) => ({ revision: record ? record.getInt('revision') : 0, preference: { ...defaults, ...(record ? JSON.parse(record.getString('preference')) : {}) } })
module.exports = {
  read(event) { const user = current(event.app, event.auth); return event.json(200, dto(row(event.app, user.id))) },
  save(event) {
    current(event.app, event.auth)
    const body = event.requestInfo().body, input = body.preference
    if (Object.keys(body).length !== 2 || Object.keys(body).some((key) => !['revision', 'preference'].includes(key)) || !Number.isSafeInteger(body.revision) || body.revision < 0 || !input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some((key) => !Object.keys(defaults).includes(key)) || typeof input.showCounters !== 'boolean' || typeof input.highlightNonZero !== 'boolean') throw new BadRequestError('Préférences d’affichage invalides.')
    if (input.theme !== undefined && !['default', 'light', 'dark'].includes(input.theme) || input.density !== undefined && !['default', 'compact', 'comfortable'].includes(input.density)) throw new BadRequestError('Thème ou densité invalide.')
    for (const [key, min, max] of [['searchWidth', 400, 1200], ['sidebarWidth', 180, 360]]) if (input[key] !== undefined && input[key] !== null && (!Number.isSafeInteger(input[key]) || input[key] < min || input[key] > max)) throw new BadRequestError('Largeur personnelle invalide.')
    let saved
    event.app.runInTransaction((app) => {
      const user = current(app, event.auth), existing = row(app, user.id), before = dto(existing)
      if (before.revision !== body.revision) throw new ApiError(409, 'Vos préférences ont changé ailleurs. Rechargez-les avant de réessayer.')
      const record = existing || new Record(app.findCollectionByNameOrId('core_display_preferences'))
      record.set('user', user.id); record.set('preference', { ...before.preference, ...input }); record.set('revision', before.revision + 1)
      app.save(record); saved = dto(record)
      policy.audit(app, 'core_display_preferences', record.id, user.id, before, saved, 'display_preferences_update')
    })
    return event.json(200, saved)
  },
}
