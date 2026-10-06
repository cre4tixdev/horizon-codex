module.exports = (event) => {
  const activity = require(`${__hooks}/lib/activity.js`)
  if (!activity.allowed(event.app, event.auth, true)) throw new ForbiddenError('Accès refusé.')
  const body = event.requestInfo().body
  if (!Array.isArray(body.entries) || !body.entries.length || body.entries.length > 100) throw new BadRequestError('Liste d’adresses invalide.')
  const root = activity.source(event.app, 'contacts_companies', body.company, true)
  const operation = /^[a-zA-Z0-9-]{16,64}$/.test(body.operation || '') ? body.operation : ''
  let result
  event.app.runInTransaction((app) => {
    const collection = app.findCollectionByNameOrId('contacts_addresses')
    const ids = new Set(); const primaryTypes = new Set()
    const records = body.entries.map((entry) => {
      if (!entry || typeof entry.input !== 'object' || !entry.input || entry.id && !/^[a-z0-9]{15}$/.test(entry.id) || entry.creation_id && !/^[a-z0-9]{15}$/.test(entry.creation_id)) throw new BadRequestError('Adresse invalide.')
      let record
      const id = entry.id || entry.creation_id
      if (id) {
        if (ids.has(id)) throw new BadRequestError('Adresse présente deux fois.')
        ids.add(id)
        if (entry.id) record = app.findRecordById(collection.name, id)
        else { try { record = app.findRecordById(collection.name, id) } catch { record = new Record(collection); record.id = id } }
        if (!record.isNew() && record.getString('company') !== root.id) throw new ForbiddenError('Adresse d’une autre société.')
      } else record = new Record(collection)
      for (const field of ['type', 'label', 'email', 'line1', 'line2', 'postal_code', 'city', 'country', 'state_region', 'is_primary']) {
        if (entry.input[field] !== undefined) record.set(field, entry.input[field])
      }
      record.set('company', root.id); record.set('__audit_actor', event.auth.id); record.set('__activity_operation', operation)
      if (record.getBool('is_primary')) {
        const type = record.getString('type')
        if (primaryTypes.has(type)) throw new BadRequestError('Une seule adresse principale est possible par usage.')
        primaryTypes.add(type)
      }
      return record
    })
    // Replace a primary address within the same transaction, without deleting data.
    for (const record of records.filter((record) => record.getBool('is_primary'))) {
      const previous = app.findRecordsByFilter(collection.name, 'company = {:company} && type = {:type} && is_primary = true && id != {:id}', '', 0, 0, { company: root.id, type: record.getString('type'), id: record.id })
      for (const old of previous) {
        old.set('is_primary', false); old.set('__audit_actor', event.auth.id); old.set('__activity_operation', operation); app.save(old)
      }
    }
    for (const record of records) app.save(record)
    result = records.map((record) => record.publicExport())
  })
  return event.json(200, { items: result })
}
