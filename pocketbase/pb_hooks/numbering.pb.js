routerAdd('POST', '/api/horizon/settings/sequences/save', (event) => require(`${__hooks}/lib/numbering-settings.js`)(event), $apis.requireAuth('core_users'))
