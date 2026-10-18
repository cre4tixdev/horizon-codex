const catalog = require(`${__hooks}/config/table-columns.json`)
const policy = require(`${__hooks}/lib/access-policy.js`)
const actor = (app, auth, write) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id)
  if (!user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active') || write && !policy.settings(app, user)) throw new ForbiddenError('Paramétrage réservé aux administrateurs habilités.')
  return user
}
const dto = (record, key) => ({ key, revision: record ? record.getInt('revision') : 0, excluded: record ? JSON.parse(record.getString('excluded')) : [] })
module.exports = {
  read(event) {
    actor(event.app, event.auth, false)
    const records = event.app.findRecordsByFilter('settings_table_columns', '', '', 0, 0)
    return event.json(200, { items: catalog.map((table) => dto(records.find((record) => record.getString('table_key') === table.key), table.key)) })
  },
  save(event) {
    actor(event.app, event.auth, true)
    const key = event.request.pathValue('context'), table = catalog.find((table) => table.key === key), body = event.requestInfo().body
    if (!table || Object.keys(body).length !== 2 || Object.keys(body).some((key) => !['revision', 'excluded'].includes(key)) || !Number.isSafeInteger(body.revision) || body.revision < 0 || !Array.isArray(body.excluded) || body.excluded.length > 100 || body.excluded.some((id) => typeof id !== 'string' || !table.columns.some((column) => column.id === id && !column.required))) throw new BadRequestError('Colonnes proposées invalides. Les colonnes obligatoires doivent rester disponibles.')
    let saved
    event.app.runInTransaction((app) => {
      const user = actor(app, event.auth, true)
      const existing = app.findRecordsByFilter('settings_table_columns', 'table_key = {:key}', '', 1, 0, { key })[0], before = dto(existing, key)
      if (before.revision !== body.revision) throw new ApiError(409, 'Réglages modifiés ailleurs. Rechargez avant de réessayer.')
      const record = existing || new Record(app.findCollectionByNameOrId('settings_table_columns'))
      record.set('table_key', key); record.set('excluded', [...new Set(body.excluded)]); record.set('revision', before.revision + 1)
      app.save(record); saved = dto(record, key)
      policy.audit(app, 'settings_table_columns', record.id, user.id, before, saved, 'table_columns_policy_update')
    })
    return event.json(200, saved)
  },
}
