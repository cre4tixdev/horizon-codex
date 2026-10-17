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

routerAdd('POST', '/api/horizon/notifications/{id}/dismiss', (e) => require(`${__hooks}/lib/notification-inbox.js`).dismiss(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/notifications/dismiss-read', (e) => require(`${__hooks}/lib/notification-inbox.js`).dismissRead(e), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/notifications/preferences', (e) => require(`${__hooks}/lib/notification-preferences.js`).read(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/notifications/preferences', (e) => require(`${__hooks}/lib/notification-preferences.js`).save(e), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/notifications/inbox', (e) => require(`${__hooks}/lib/notification-inbox.js`).inbox(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/notifications/{id}/read', (e) => require(`${__hooks}/lib/notification-inbox.js`).markRead(e), $apis.requireAuth('core_users'))
