routerAdd('GET', '/api/horizon/activity/feed', (event) => require(`${__hooks}/lib/activity-feed.js`).feed(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/activity/users', (event) => require(`${__hooks}/lib/activity-request.js`).users(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/activity/attachments/delete', (event) => require(`${__hooks}/lib/activity-request.js`).removeAttachment(event), $apis.requireAuth('core_users'))
onRecordCreateRequest((event) => require(`${__hooks}/lib/activity-request.js`).create(event), 'core_activity_events')
onRecordUpdateRequest((event) => require(`${__hooks}/lib/activity-request.js`).task(event), 'core_tasks')
routerAdd('GET', '/api/horizon/activity/events/{id}/avatar', (event) => require(`${__hooks}/lib/activity-request.js`).avatar(event), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/activity/events', (event) => require(`${__hooks}/lib/activity-read.js`).events(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/activity/tasks', (event) => require(`${__hooks}/lib/activity-read.js`).tasks(event), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/activity/events/{id}/email-attachment', (event) => require(`${__hooks}/lib/activity-request.js`).emailAttachment(event), $apis.requireAuth('core_users'))
