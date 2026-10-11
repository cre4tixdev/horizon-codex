routerAdd('GET', '/api/horizon/settings/ux', (event) => require(`${__hooks}/lib/ux-settings.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/settings/ux', (event) => require(`${__hooks}/lib/ux-settings.js`).save(event), $apis.requireAuth('core_users'))
