// Core NotificationService: persist an internal business alert, no e-mail side effect.
module.exports = (app, user, event, title, body) => {
  const record = new Record(app.findCollectionByNameOrId('core_notifications'))
  for (const [key, value] of Object.entries({ user, type: 'activity', title, body, source_module: event.getString('source_module'), source_entity: event.getString('source_entity'), source_record_id: event.getString('source_record_id'), activity_event: event.id })) record.set(key, value)
  app.save(record)
}
