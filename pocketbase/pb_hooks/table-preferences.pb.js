routerAdd('GET', '/api/horizon/table-preferences/{context}', (event) => require(`${__hooks}/lib/table-preferences.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/table-preferences/{context}', (event) => require(`${__hooks}/lib/table-preferences.js`).save(event), $apis.requireAuth('core_users'))
