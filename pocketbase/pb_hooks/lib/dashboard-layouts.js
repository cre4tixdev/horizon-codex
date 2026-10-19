const policy = require(`${__hooks}/lib/access-policy.js`)
const current = (app, auth) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id)
  if (!user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active')) throw new ForbiddenError('Compte inactif.')
  return user
}
const exact = (input, keys) => input && typeof input === 'object' && !Array.isArray(input) && Object.keys(input).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(input, key))
const minimums = { forecast: [3, 2], ordered: [3, 2], invoiced: [3, 2], margin: [3, 2], business: [6, 4], economic: [6, 3], planning: [6, 3], activity: [6, 3] }
const validate = (input) => {
  if (!exact(input, ['defaultId', 'dashboards']) || !Array.isArray(input.dashboards) || input.dashboards.length > 12) throw new BadRequestError('Configuration de dashboard invalide.')
  const ids = new Set()
  const dashboards = input.dashboards.map((dashboard) => {
    if (!exact(dashboard, ['id', 'name', 'widgets']) || typeof dashboard.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(dashboard.id) || dashboard.id === 'horizon' || ids.has(dashboard.id) || typeof dashboard.name !== 'string' || !dashboard.name.trim() || dashboard.name.trim().length > 80 || [...dashboard.name].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || !Array.isArray(dashboard.widgets) || dashboard.widgets.length > 8) throw new BadRequestError('Dashboard personnel invalide.')
    ids.add(dashboard.id)
    const types = new Set()
    const widgets = dashboard.widgets.map((widget) => {
      if (!exact(widget, ['type', 'width', 'height']) || typeof widget.type !== 'string' || !Object.prototype.hasOwnProperty.call(minimums, widget.type) || types.has(widget.type)) throw new BadRequestError('Widget invalide ou présent plusieurs fois.')
      const [width, height] = minimums[widget.type]
      if (![3, 4, 6, 8, 12].includes(widget.width) || widget.width < width || !Number.isInteger(widget.height) || widget.height < height || widget.height > 8) throw new BadRequestError('Dimensions de widget invalides.')
      types.add(widget.type)
      return { type: widget.type, width: widget.width, height: widget.height }
    })
    return { id: dashboard.id, name: dashboard.name.trim(), widgets }
  })
  if (input.defaultId !== 'horizon' && !ids.has(input.defaultId)) throw new BadRequestError('Dashboard par défaut introuvable.')
  return { defaultId: input.defaultId, dashboards }
}
const row = (app, user) => app.findRecordsByFilter('dashboard_preferences', 'user = {:user}', '', 1, 0, { user })[0]
const dto = (record) => record ? { revision: record.getInt('revision'), preference: JSON.parse(record.getString('preference')) } : { revision: 0, preference: { defaultId: 'horizon', dashboards: [] } }
module.exports = {
  read(event) { const user = current(event.app, event.auth); return event.json(200, dto(row(event.app, user.id))) },
  save(event) {
    current(event.app, event.auth)
    const body = event.requestInfo().body
    if (!exact(body, ['revision', 'preference']) || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new BadRequestError('Révision invalide.')
    const preference = validate(body.preference)
    let saved
    event.app.runInTransaction((app) => {
      const user = current(app, event.auth), existing = row(app, user.id), before = dto(existing)
      if (before.revision !== body.revision) throw new ApiError(409, 'Vos dashboards ont été modifiés ailleurs. Rechargez avant de réessayer.')
      const record = existing || new Record(app.findCollectionByNameOrId('dashboard_preferences'))
      record.set('user', user.id); record.set('preference', preference); record.set('revision', before.revision + 1)
      app.save(record); saved = dto(record)
      policy.audit(app, 'dashboard_preferences', record.id, user.id, before, saved, 'dashboard_layouts_update')
    })
    return event.json(200, saved)
  },
}
