const policy = require(`${__hooks}/lib/access-policy.js`)
const contexts = {
  contacts: ['companies', 'people'], crm: ['tenders', 'opportunities'], sales: ['all', 'quote', 'order'],
  purchasing: ['all', 'requests', 'orders'], billing: ['customer', 'supplier', 'customer_credit', 'supplier_credit'],
  inventory: ['products', 'stock', 'inventories', 'operations.all'], hr: ['employees', 'teams'], expenses: ['reports'], leave: ['requests'],
}
const context = (value) => {
  if (typeof value !== 'string' || value.length > 100) throw new BadRequestError('Tableau invalide.')
  const [module, ...parts] = value.split('.'), name = parts.join('.')
  const operations = module === 'inventory' && /^operations\.(IN|OUT|PREP|RET|INT|INV)(,(IN|OUT|PREP|RET|INT|INV))*$/.test(name) && new Set(parts[1].split(',')).size === parts[1].split(',').length
  if (!(Object.prototype.hasOwnProperty.call(contexts, module) && contexts[module].includes(name)) && !operations) throw new BadRequestError('Tableau non autorisé.')
  return module
}
const current = (app, auth, key) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id), module = context(key)
  if (!policy.permissions(app, user).includes(`${module}.read`)) throw new ForbiddenError('Tableau inaccessible.')
  return user
}
const row = (app, user, key) => app.findRecordsByFilter('core_table_preferences', 'user = {:user} && table_key = {:key}', '', 1, 0, { user, key })[0]
const dto = (record) => record ? { revision: record.getInt('revision'), preference: JSON.parse(record.getString('preference')) } : { revision: 0, preference: { order: [], hidden: [] } }
const preference = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !['order', 'hidden'].every((key) => Object.prototype.hasOwnProperty.call(input, key)) || Object.keys(input).some((key) => !['order', 'hidden', 'widths'].includes(key))) throw new BadRequestError('Colonnes invalides.')
  const result = {}
  for (const key of ['order', 'hidden']) {
    if (!Array.isArray(input[key]) || input[key].length > 100 || input[key].some((id) => typeof id !== 'string' || !id.trim() || id.length > 160 || [...id].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))) throw new BadRequestError('Identifiants de colonnes invalides.')
    result[key] = [...new Set(input[key])]
  }
  if (Object.prototype.hasOwnProperty.call(input, 'widths')) {
    const widths = input.widths
    if (!widths || typeof widths !== 'object' || Array.isArray(widths) || Object.keys(widths).length > 100 || Object.entries(widths).some(([id, width]) => !id.trim() || id.length > 160 || [...id].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || !Number.isFinite(width) || width < 36 || width > 10000)) throw new BadRequestError('Largeurs de colonnes invalides.')
    result.widths = widths
  }
  return result
}
module.exports = {
  read(event) {
    const key = event.request.pathValue('context'), user = current(event.app, event.auth, key)
    return event.json(200, dto(row(event.app, user.id, key)))
  },
  save(event) {
    const key = event.request.pathValue('context'), body = event.requestInfo().body
    current(event.app, event.auth, key)
    if (Object.keys(body).length !== 2 || Object.keys(body).some((key) => !['revision', 'preference'].includes(key)) || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new BadRequestError('Préférence ou révision invalide.')
    const input = preference(body.preference)
    let saved
    event.app.runInTransaction((app) => {
      const user = current(app, event.auth, key), existing = row(app, user.id, key), before = dto(existing)
      if (before.revision !== body.revision) throw new ApiError(409, 'Cet affichage a été modifié ailleurs. Rechargez les colonnes avant de réessayer.')
      const record = existing || new Record(app.findCollectionByNameOrId('core_table_preferences'))
      record.set('user', user.id); record.set('table_key', key); record.set('preference', input); record.set('revision', before.revision + 1)
      app.save(record); saved = dto(record)
      policy.audit(app, 'core_table_preferences', record.id, user.id, before, saved, 'table_preferences_update')
    })
    return event.json(200, saved)
  },
}
