module.exports = (event, audit = true) => {
  event.app.runInTransaction((txApp) => {
    event.app = txApp
    const target = event.record.collection()
    const owned = []
    // Inspect real relation fields, regardless of user permissions, record state,
    // module name or cascadeDelete: future document modules are covered too.
    for (const collection of txApp.findAllCollections()) {
      if (collection.type === 'view') continue
      const fields = JSON.parse(JSON.stringify(collection)).fields
      for (const field of fields) {
        if (field.type !== 'relation' || field.collectionId !== target.id) continue
        const filter = `${field.name}.id ?= {:id}`
        const children = target.name === 'contacts_companies' && ['contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts'].includes(collection.name) && field.name === 'company'
        if (children) { owned.push(...txApp.findRecordsByFilter(collection.id, filter, '', 0, 0, { id: event.record.id })); continue }
        if (txApp.findRecordsByFilter(collection.id, filter, '', 1, 0, { id: event.record.id }).length) {
          throw new ApiError(409, 'Suppression impossible : des fiches ou pièces liées existent. Utilisez l’archivage.')
        }
      }
    }
    // A piece can reference an owned address/account instead of the company.
    // Check those incoming links too before removing any owned metadata.
    for (const child of owned) {
      for (const collection of txApp.findAllCollections()) {
        if (collection.type === 'view') continue
        for (const field of JSON.parse(JSON.stringify(collection)).fields) {
          if (field.type !== 'relation' || field.collectionId !== child.collection().id) continue
          if (txApp.findRecordsByFilter(collection.id, `${field.name}.id ?= {:id}`, '', 1, 0, { id: child.id }).length) throw new ApiError(409, 'Suppression impossible : des fiches ou pièces liées existent. Utilisez l’archivage.')
        }
      }
    }
    // Local address/role rows are owned by this unused company. Delete them in
    // the same transaction; their audit history and the parent audit remain.
    for (const record of owned) { record.set('__audit_actor', event.record.getString('__audit_actor')); txApp.delete(record) }
    if (audit) require(`${__hooks}/lib/audit.js`)(event, 'delete')
    else event.next()
  })
}
