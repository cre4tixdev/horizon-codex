routerAdd('GET', '/api/horizon/accounting/fixed-accounts', (event) => require(`${__hooks}/lib/analytic-fixed.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/accounting/fixed-accounts', (event) => require(`${__hooks}/lib/analytic-fixed.js`).save(event), $apis.requireAuth('core_users'))
