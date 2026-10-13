routerAdd('GET', '/api/horizon/account', (event) => require(`${__hooks}/lib/account.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/account/save', (event) => require(`${__hooks}/lib/account.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/account/password', (event) => require(`${__hooks}/lib/account.js`).password(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/account/presence', (event) => require(`${__hooks}/lib/account.js`).presence(event), $apis.requireAuth('core_users'))

routerAdd('GET', '/api/horizon/account/avatar/{id}', (event) => require(`${__hooks}/lib/account.js`).avatar(event), $apis.requireAuth('core_users'))
