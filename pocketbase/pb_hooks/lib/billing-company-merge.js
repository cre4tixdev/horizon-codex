const collections = ['billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes']
module.exports = {
  blockers(app, source, target) {
    const ids = require(`${__hooks}/lib/company-identity.js`), family = [...ids.ids(app, source), ...ids.ids(app, target)], params = {}, filter = '(' + family.map((id, index) => { params[`id${index}`] = id; return `company = {:id${index}}` }).join(' || ') + ')'
    for (const collection of ['billing_supplier_invoices', 'billing_supplier_credit_notes']) {
      const keys = new Set()
      for (const record of app.findRecordsByFilter(collection, filter + ' && status != "cancelled" && supplier_reference_key != ""', 'id', 0, 0, params)) {
        const key = record.getString('supplier_reference_key')
        if (keys.has(key)) return ['Deux factures fournisseurs portent la même référence dans les sociétés à réunir. Résolvez ce doublon avant la fusion.']
        keys.add(key)
      }
    }
    return []
  },
  apply(app, user, source, target) {
    for (const collection of collections) require(`${__hooks}/lib/company-merge-drafts.js`)(app, user, app.findRecordsByFilter(collection, 'company = {:source} && status = "draft"', 'id', 0, 0, { source }), 'company', target)
  },
}
