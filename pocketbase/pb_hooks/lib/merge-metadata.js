// Read-only projection helper, called by each owning adapter with fixed columns.
module.exports = (app, table, columns) => {
  const model = Object.fromEntries(columns.map((key) => [key, ''])), result = arrayOf(new DynamicModel(model))
  app.db().newQuery(`SELECT ${columns.join(',')} FROM ${table} WHERE active = true AND merged_into = '' ORDER BY created,id LIMIT 50001`).all(result)
  if (result.length > 50000) throw new BadRequestError('Plus de 50 000 fiches dans ce domaine : le rapprochement nécessite un périmètre dédié.')
  const collectionId = app.findCollectionByNameOrId(table).id
  return result.map((record) => ({ ...record, collectionId }))
}
