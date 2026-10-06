routerAdd('GET', '/api/horizon/contacts/groups', (event) => require(`${__hooks}/lib/contact-groups.js`)(event), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/contacts/navigation', (event) => require(`${__hooks}/lib/contact-groups.js`)(event, true), $apis.requireAuth('core_users'))
