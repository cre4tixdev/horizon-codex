// Core NotificationService: persist an internal business alert, no e-mail side effect.
module.exports = (app, user, event, title, body, eventType = 'other_activity') => {
  const preferences = require(`${__hooks}/lib/notification-preferences.js`)
  if (!preferences.enabled(app, user, eventType)) return
  const record = new Record(app.findCollectionByNameOrId('core_notifications'))
  for (const [key, value] of Object.entries({ user, type: 'activity', event_type: eventType, title, body, source_module: event.getString('source_module'), source_entity: event.getString('source_entity'), source_record_id: event.getString('source_record_id'), activity_event: event.id })) record.set(key, value)
  app.save(record)
  return record
}
