// A recipient may only mark their own message read; its timestamp is server-owned.
onRecordUpdateRequest((event) => {
  if (!event.auth || event.auth.collection().name !== 'core_users') return event.next()
  event.record.set('read_at', event.record.original().getString('read_at') || new Date().toISOString())
  event.app.runInTransaction((txApp) => {
    event.app = txApp
    event.next()
    const activity = event.record.getString('activity_event')
    if (!activity) return
    const mentions = txApp.findRecordsByFilter('core_activity_mentions', 'event = {:event} && user = {:user}', '', 1, 0, { event: activity, user: event.auth.id })
    for (const mention of mentions) { mention.set('read_at', event.record.getString('read_at')); txApp.save(mention) }
  })
}, 'core_notifications')
