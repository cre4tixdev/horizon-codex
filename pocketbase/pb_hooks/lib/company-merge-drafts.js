// Owning adapters select the eligible records; no frozen fields or lines are recalculated.
module.exports = (app, user, records, field, target) => {
  const rights = require(`${__hooks}/lib/access-policy.js`).permissions(app, user)
  const owners = { accounting: 'contacts', inventory: 'inventory', sales: 'sales', billing: 'billing', purchasing: 'purchasing' }
  for (const record of records) {
    const owner = owners[record.collection().name.split('_')[0]]
    if (!owner || !rights.includes(`${owner}.write`)) throw new ForbiddenError('Les droits de modification des modules portant les brouillons sont nécessaires pour cette fusion.')
    const before = record.publicExport()
    record.set(field, target); app.save(record)
    require(`${__hooks}/lib/access-policy.js`).audit(app, record.collection().name, record.id, user.id, before, record.publicExport(), 'company_merge_relink')
  }
}
