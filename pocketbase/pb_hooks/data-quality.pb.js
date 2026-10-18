routerAdd('GET', '/api/horizon/data-quality/candidates', (e) => require(`${__hooks}/lib/merge-candidates.js`).list(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/inventory/merge/preview', (e) => require(`${__hooks}/lib/catalog-merge.js`).preview(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/inventory/merge/apply', (e) => require(`${__hooks}/lib/catalog-merge.js`).apply(e), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/inventory/products/{id}/merged-sources', (e) => require(`${__hooks}/lib/catalog-merge.js`).sources(e), $apis.requireAuth('core_users'))
