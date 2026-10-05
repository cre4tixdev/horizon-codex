routerAdd('GET', '/api/horizon/activity/users', (event) => require(`${__hooks}/lib/activity-request.js`).users(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/activity/attachments/delete', (event) => require(`${__hooks}/lib/activity-request.js`).removeAttachment(event), $apis.requireAuth('core_users'))
onRecordCreateRequest((event) => require(`${__hooks}/lib/activity-request.js`).create(event), 'core_activity_events')
onRecordUpdateRequest((event) => require(`${__hooks}/lib/activity-request.js`).task(event), 'core_tasks')
