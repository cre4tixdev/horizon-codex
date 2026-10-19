// Contacts owns canonical identity. Callers retain their business permissions/scopes.
const resolve = (app, id) => {
  if (!id) return ''
  if (typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Société invalide.')
  const seen = new Set()
  while (true) {
    if (seen.has(id) || seen.size >= 50) throw new BadRequestError('Chaîne de fusion de sociétés incohérente.')
    seen.add(id)
    const record = app.findRecordById('contacts_companies', id), next = record.getString('merged_into')
    if (!next) return id
    id = next
  }
}
const ids = (app, id) => {
  const root = resolve(app, id)
  if (!root) return []
  const aliases = app.findRecordsByFilter('contacts_companies', 'merged_into = {:root}', 'id', 1001, 0, { root })
  if (aliases.length > 1000) throw new BadRequestError('Trop de fiches dans cette identité client.')
  return [root, ...aliases.map((record) => record.id)]
}
const predicate = (field, family, params, key = 'company', sql = false) => {
  if (!family.length) return sql ? '0' : 'id = ""'
  return '(' + family.map((value, index) => { const name = `${key}_${index}`; params[name] = value; return `${field} = {:${name}}` }).join(sql ? ' OR ' : ' || ') + ')'
}
const condition = (app, field, id, params, key = 'company', sql = false) => predicate(field, ids(app, id), params, key, sql)
module.exports = { resolve, ids, condition, predicate, same: (app, left, right) => resolve(app, left) === resolve(app, right) }
