const relationOwners = {
  contacts_people: ['contacts', ['company']], contacts_addresses: ['contacts', ['company']], contacts_company_roles: ['contacts', ['company']],
  contacts_companies: ['contacts', ['merged_into']],
  accounting_third_party_accounts: ['contacts', ['company']], accounting_analytic_accounts: ['analysis', ['company']],
  crm_opportunities: ['crm', ['company', 'contact']], crm_tenders: ['crm', ['company', 'contact']],
  sales_quotes: ['sales', ['company', 'contact']], sales_orders: ['sales', ['company', 'contact']],
  hr_employees: ['hr', ['external_company']], inventory_product_suppliers: ['inventory', ['supplier']],
  purchasing_request_lines: ['purchasing', ['suggested_supplier']], purchasing_orders: ['purchasing', ['supplier']],
  billing_invoices: ['billing', ['company']], billing_supplier_invoices: ['billing', ['company']], billing_credit_notes: ['billing', ['company']], billing_supplier_credit_notes: ['billing', ['company']], billing_payments: ['billing', ['company']],
  expenses_lines: ['expenses', ['company', 'contact', 'guests']],
}
const polymorphicOwners = { core_tasks: 'contacts', documents_links: 'documents', inventory_moves: 'inventory', purchasing_orders: 'purchasing' }
const adapters = ['accounting', 'billing', 'sales', 'purchasing', 'catalog']
module.exports = {
  inspect(app, user, source, target, dependencies) {
    const rights = require(`${__hooks}/lib/access-policy.js`).permissions(app, user), counts = {}, blockers = [], seen = new Set()
    for (const dependency of dependencies) {
      const [collection, field, rows] = dependency, relation = relationOwners[collection], owner = typeof field === 'string' ? relation?.[0] : polymorphicOwners[collection]
      if (!owner || typeof field === 'string' && !relation[1].includes(field)) { blockers.push('Une relation métier non prise en charge empêche cette fusion. Aucun historique ne sera déplacé partiellement.'); continue }
      const records = typeof field === 'string' ? rows : field
      for (const record of records) { const key = collection + '/' + record.id; if (seen.has(key)) continue; seen.add(key); if (rights.includes(`${owner}.read`) && (owner !== 'expenses' || user.getString('expenses_scope') === 'all') && (owner !== 'hr' || user.getString('hr_scope') === 'all') && !['analysis', 'documents'].includes(owner)) counts[owner] = (counts[owner] || 0) + 1 }
      if (['sales_quotes', 'purchasing_orders', 'billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes'].includes(collection) && records.some((r) => r.status === 'draft') || collection === 'inventory_product_suppliers' && records.some((r) => r.active) || collection === 'purchasing_request_lines') { if (!rights.includes(`${owner}.write`)) blockers.push('Les droits de modification des modules portant les brouillons sont nécessaires pour cette fusion.') }
    }
    for (const adapter of adapters) {
      const implementation = require(`${__hooks}/lib/${adapter}-company-merge.js`)
      if (implementation.blockers) blockers.push(...implementation.blockers(app, source, target))
    }
    return { counts, blockers: [...new Set(blockers)] }
  },
  apply(app, user, source, target) { for (const id of require(`${__hooks}/lib/company-identity.js`).ids(app, source)) for (const adapter of adapters) require(`${__hooks}/lib/${adapter}-company-merge.js`).apply(app, user, id, target) },
}
