routerAdd('GET', '/api/horizon/calendar/events', (event) => require(`${__hooks}/lib/calendar.js`)(event), $apis.requireAuth('core_users'))
