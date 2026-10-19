const records = (app, company) => app.findRecordsByFilter('accounting_third_party_accounts', 'company = {:company}', 'id', 0, 0, { company })
module.exports = {
  blockers(app, source, target) {
    const family = require(`${__hooks}/lib/company-identity.js`), rows = [...family.ids(app, source), ...family.ids(app, target)].flatMap((id) => records(app, id)), codes = new Map()
    return rows.some((record) => { const type = record.getString('type'), code = record.getString('account_code'); if (codes.has(type) && codes.get(type) !== code) return true; codes.set(type, code); return false }) ? ['Les comptes tiers comptables diffèrent. Harmonisez-les dans Comptabilité avant de fusionner ces sociétés.'] : []
  },
  apply(app, user, source, target) {
    const targetRows = records(app, target)
    require(`${__hooks}/lib/company-merge-drafts.js`)(app, user, records(app, source).filter((record) => !targetRows.some((other) => other.getString('type') === record.getString('type'))), 'company', target)
  },
}
