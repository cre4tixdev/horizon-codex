const policy = require(`${__hooks}/lib/access-policy.js`)
const current = (app, auth) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id)
  if (!user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active')) throw new ForbiddenError('Compte inactif.')
  return user
}
const exact = (input, keys) => input && typeof input === 'object' && !Array.isArray(input) && Object.keys(input).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(input, key))
const minimums = { forecast: [2, 1], ordered: [2, 1], invoiced: [2, 1], margin: [2, 1], business: [2, 2], economic: [2, 2], planning: [2, 2], activity: [2, 2], records: [2, 2], shortcuts: [2, 1], time: [2, 2], leave: [2, 2], approvals: [2, 2] }
const validate = (input) => {
  if (!exact(input, ['defaultId', 'dashboards']) || !Array.isArray(input.dashboards) || input.dashboards.length > 12 || JSON.stringify(input).length > 1000000) throw new BadRequestError('Configuration de dashboard invalide.')
  const ids = new Set()
  const dashboards = input.dashboards.map((dashboard) => {
    if (!exact(dashboard, ['id', 'name', 'widgets']) || typeof dashboard.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(dashboard.id) || dashboard.id === 'horizon' || ids.has(dashboard.id) || typeof dashboard.name !== 'string' || !dashboard.name.trim() || dashboard.name.trim().length > 80 || [...dashboard.name].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || !Array.isArray(dashboard.widgets) || dashboard.widgets.length > 32) throw new BadRequestError('Dashboard personnel invalide.')
    ids.add(dashboard.id)
    const instances = new Set()
    const widgets = dashboard.widgets.map((widget) => {
      const legacy = exact(widget, ['type', 'width', 'height'])
      if (!legacy && (!widget || typeof widget !== 'object' || Array.isArray(widget) || Object.keys(widget).some((key) => !['id', 'type', 'width', 'height', 'x', 'y', 'config'].includes(key)))) throw new BadRequestError('Widget invalide.')
      if (typeof widget.type !== 'string' || !Object.prototype.hasOwnProperty.call(minimums, widget.type)) throw new BadRequestError('Type de widget invalide.')
      const id = legacy ? `legacy-${widget.type}` : widget.id
      if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(id) || instances.has(id)) throw new BadRequestError('Identifiant de widget invalide ou présent plusieurs fois.')
      instances.add(id)
      const [width, height] = minimums[widget.type]
      if (!Number.isInteger(widget.width) || widget.width < width || widget.width > 12 || !Number.isInteger(widget.height) || widget.height < height || widget.height > 12) throw new BadRequestError('Dimensions de widget invalides.')
      for (const key of ['x', 'y']) if (widget[key] !== undefined && (!Number.isInteger(widget[key]) || widget[key] < 0 || widget[key] > (key === 'x' ? 12 - widget.width : 1000))) throw new BadRequestError('Position de widget invalide.')
      if (legacy) return { type: widget.type, width: widget.width, height: widget.height }
      const config = require(`${__hooks}/lib/dashboard-widget-config.js`)(widget.config)
      return { id, type: widget.type, width: widget.width, height: widget.height, ...(widget.x === undefined ? {} : { x: widget.x }), ...(widget.y === undefined ? {} : { y: widget.y }), config }
    })
    return { id: dashboard.id, name: dashboard.name.trim(), widgets }
  })
  if (input.defaultId !== 'horizon' && !ids.has(input.defaultId)) throw new BadRequestError('Dashboard par défaut introuvable.')
  const preference = { defaultId: input.defaultId, dashboards }
  const bytes = [...JSON.stringify(preference)].reduce((size, char) => size + (char.codePointAt(0) > 0xffff ? 4 : char.charCodeAt(0) > 0x7ff ? 3 : char.charCodeAt(0) > 0x7f ? 2 : 1), 0)
  if (bytes > 60000) throw new BadRequestError('La configuration est trop volumineuse. Réduisez le nombre de widgets ou de pages.')
  return preference
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
