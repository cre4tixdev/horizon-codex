routerAdd('GET', '/api/horizon/company-lookup/status', (event) => require(`${__hooks}/lib/company-lookup.js`)(event), $apis.requireAuth('core_users'))
