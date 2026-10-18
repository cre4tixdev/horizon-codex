// Shared inspection only. Mutations remain in the owning business adapter.
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value
const incoming = (app, candidates, owned) => {
  const dependencies = [], collections = app.findAllCollections().filter((collection) => collection.type !== 'view')
  const relations = collections.flatMap((collection) => JSON.parse(JSON.stringify(collection)).fields.filter((field) => field.type === 'relation').map((field) => ({ collection, field })))
  const polymorphic = collections.filter((collection) => !['core_activity_events', 'core_audit', 'core_notifications'].includes(collection.name) && collection.fields.getByName('source_entity') && collection.fields.getByName('source_record_id'))
  for (const record of candidates) {
    for (const { collection, field } of relations) {
      if (field.collectionId !== record.collection().id || owned(record, collection.name, field.name)) continue
      const found = app.findRecordsByFilter(collection.name, `${field.name}.id ?= {:id}`, 'id', 1, 0, { id: record.id })
      if (found.length) dependencies.push([collection.name, field.name, found.map((row) => row.publicExport())])
    }
    for (const collection of polymorphic) {
      const found = app.findRecordsByFilter(collection.name, 'source_entity = {:entity} && source_record_id = {:id}', 'id', 1, 0, { entity: record.collection().name, id: record.id })
      if (found.length) dependencies.push([collection.name, found.map((row) => row.publicExport())])
    }
  }
  return dependencies
}

const authorize = (app, user, domain) => {
  const rights = require(`${__hooks}/lib/access-policy.js`).permissions(app, user)
  if (!user || user.getString('erp_profile') === 'viewer' || ['read', 'write', 'merge'].some((action) => !rights.includes(`${domain}.${action}`))) throw new ForbiddenError('La consultation, la modification et la fusion du domaine sont nécessaires.')
}
const validate = (e) => {
  const record = e.record, original = record.original(), collection = record.collection()
  if (['contacts_companies', 'contacts_people', 'inventory_products'].includes(collection.name)) {
    if (original.getString('merged_into')) throw new BadRequestError('Une fiche fusionnée ne peut être modifiée ou réactivée.')
    if ((record.getString('merged_into') !== original.getString('merged_into') || record.getString('merged_at') !== original.getString('merged_at')) && !record.getBool('__merge_operation')) throw new BadRequestError('Utilisez l’action de fusion.')
  }
  const sourceEntity = record.getString('source_entity'), sourceId = record.getString('source_record_id')
  if (!['core_activity_events', 'core_audit', 'core_notifications'].includes(collection.name) && ['contacts_companies', 'contacts_people', 'inventory_products'].includes(sourceEntity) && sourceId && (record.isNew() || original.getString('source_entity') !== sourceEntity || original.getString('source_record_id') !== sourceId)) {
    if (e.app.findRecordById(sourceEntity, sourceId).getString('merged_into')) throw new BadRequestError('Cette fiche a été fusionnée. Rattachez le document à la fiche conservée.')
  }
  for (const field of JSON.parse(JSON.stringify(collection)).fields) {
    if (field.type !== 'relation' || field.name === 'merged_into') continue
    const destination = e.app.findCollectionByNameOrId(field.collectionId)
    if (!['contacts_companies', 'contacts_people', 'inventory_products'].includes(destination.name)) continue
    const before = original.getStringSlice(field.name)
    for (const id of record.getStringSlice(field.name)) if (record.isNew() || !before.includes(id)) {
      if (e.app.findRecordById(destination.id, id).getString('merged_into')) throw new BadRequestError('Cette fiche a été fusionnée. Choisissez la fiche conservée.')
    }
  }
}

module.exports = { canonical, incoming, authorize, validate }
