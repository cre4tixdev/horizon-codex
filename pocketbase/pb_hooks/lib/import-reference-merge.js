// Imports owns external identities. Call inside the Contacts merge transaction.
const references = (app, entity, id) => app.findRecordsByFilter('core_external_references', 'entity_type = {:entity} && horizon_record_id = {:id}', 'id', 0, 0, { entity, id })
const apply = (app, entity, source, target) => {
  for (const record of references(app, entity, source)) { record.set('horizon_record_id', target); app.save(record) }
}
module.exports = { references, apply }
