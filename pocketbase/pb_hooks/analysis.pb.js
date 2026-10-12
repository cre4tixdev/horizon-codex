routerAdd('GET', '/api/horizon/analysis/report', (event) => require(`${__hooks}/lib/analytic-report.js`).read(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/analysis/affairs', (event) => require(`${__hooks}/lib/analytic-report.js`).list(event), $apis.requireAuth('core_users'))
