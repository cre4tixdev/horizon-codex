routerAdd('GET', '/api/horizon/dashboard/metrics', (event) => require(`${__hooks}/lib/dashboard.js`).metrics(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/dashboard/activity', (event) => require(`${__hooks}/lib/dashboard.js`).activity(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/dashboard/tasks', (event) => require(`${__hooks}/lib/dashboard.js`).tasks(event), $apis.requireAuth('core_users'))
