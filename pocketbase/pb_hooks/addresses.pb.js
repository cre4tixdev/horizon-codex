routerAdd('POST', '/api/horizon/contacts/addresses/save', (event) => require(`${__hooks}/lib/addresses.js`)(event), $apis.requireAuth('core_users'))
