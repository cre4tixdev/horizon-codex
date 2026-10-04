// Shared server audit writer. A failed audit rolls the business save back too.
module.exports = (event, action) => {
  const before = action === 'create' ? null : event.record.original().publicExport()
  event.app.runInTransaction((txApp) => {
    event.app = txApp
    event.next()
    const audit = new Record(txApp.findCollectionByNameOrId('core_audit'))
    audit.set('user', event.record.getString('__audit_actor'))
    audit.set('module', 'contacts')
    audit.set('action', action === 'update' && before.active !== event.record.getBool('active') && event.record.collection().fields.getByName('active') ? (event.record.getBool('active') ? 'restore' : 'archive') : action)
    audit.set('entity', event.record.collection().name)
    audit.set('entity_id', event.record.id)
    audit.set('before', before)
    audit.set('after', event.record.publicExport())
    audit.set('metadata', { source: 'server' })
    txApp.save(audit)
  })
}
