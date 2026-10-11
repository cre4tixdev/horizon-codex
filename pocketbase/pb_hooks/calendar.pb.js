routerAdd('GET', '/api/horizon/calendar/events', (event) => require(`${__hooks}/lib/calendar.js`)(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/calendar/manual/{id}', (event) => require(`${__hooks}/lib/calendar-manual.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/calendar/manual/save', (event) => require(`${__hooks}/lib/calendar-manual.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/calendar/manual/remove', (event) => require(`${__hooks}/lib/calendar-manual.js`).remove(event), $apis.requireAuth('core_users'))
