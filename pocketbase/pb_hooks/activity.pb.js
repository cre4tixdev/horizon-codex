routerAdd('GET', '/api/horizon/activity/users', (event) => require(`${__hooks}/lib/activity-request.js`).users(event), $apis.requireAuth('core_users'))
onRecordCreateRequest((event) => require(`${__hooks}/lib/activity-request.js`).create(event), 'core_activity_events')
onRecordUpdateRequest((event) => require(`${__hooks}/lib/activity-request.js`).task(event), 'core_tasks')
