// Shared server audit writer. A failed audit rolls the business save back too.
module.exports = (event, action) => {
  const before = action === 'create' ? null : action === 'delete' ? event.record.publicExport() : event.record.original().publicExport()
  event.app.runInTransaction((txApp) => {
    event.app = txApp
    event.next()
    const audit = new Record(txApp.findCollectionByNameOrId('core_audit'))
    audit.set('user', event.record.getString('__audit_actor'))
    audit.set('module', event.record.collection().name.startsWith('contacts_') ? 'contacts' : event.record.collection().name.startsWith('accounting_') ? 'accounting' : event.record.collection().name.startsWith('core_') ? 'core' : 'settings')
    audit.set('action', action === 'update' && before.active !== event.record.getBool('active') && event.record.collection().fields.getByName('active') ? (event.record.getBool('active') ? 'restore' : 'archive') : action)
    audit.set('entity', event.record.collection().name)
    audit.set('entity_id', event.record.id)
    audit.set('before', before)
    audit.set('after', action === 'delete' ? null : event.record.publicExport())
    audit.set('metadata', { source: 'server' })
    txApp.save(audit)
    require(`${__hooks}/lib/activity.js`).track(txApp, event.record, before, audit.getString('action'), event.record.getString('__audit_actor'), event.record.getString('__activity_operation'))
  })
}
