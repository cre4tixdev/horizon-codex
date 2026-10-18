routerAdd('GET', '/api/horizon/table-column-policies', (event) => require(`${__hooks}/lib/table-column-policies.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/table-column-policies/{context}', (event) => require(`${__hooks}/lib/table-column-policies.js`).save(event), $apis.requireAuth('core_users'))
