// Classification follows the authorized business source, never a custom category.
const labels = { quotes: 'Devis', orders: 'Commandes clients', purchases: 'Commandes fournisseurs', requests: 'Demandes d’achat', deliveries: 'Bons de livraison', receipts: 'Bons de réception', stock: 'Opérations de stock', invoices: 'Factures clients', supplier_invoices: 'Factures fournisseurs', credits: 'Avoirs clients', supplier_credits: 'Avoirs fournisseurs', technical: 'Affaire', companies: 'Société', expenses: 'Notes de frais', leave: 'Congés', other: 'Autres pièces jointes' }
function theme(source, historicalQuote = false) {
  const entity = source.collection().name
  if (entity === 'sales_quotes') return !historicalQuote && source.getString('status') === 'accepted' ? 'orders' : 'quotes'
  if (entity === 'inventory_operations') return source.getString('kind') === 'IN' ? 'receipts' : source.getString('kind') === 'OUT' ? 'deliveries' : 'stock'
  return { purchasing_orders: 'purchases', purchasing_requests: 'requests', billing_invoices: 'invoices', billing_supplier_invoices: 'supplier_invoices', billing_credit_notes: 'credits', billing_supplier_credit_notes: 'supplier_credits', crm_opportunities: 'technical', crm_tenders: 'technical', contacts_companies: 'companies', contacts_people: 'companies', expenses_reports: 'expenses', leave_requests: 'leave' }[entity] || 'other'
}
module.exports = { labels, theme,
  classify(e, row, cache) {
    const precise = ['sales_quotes', 'purchasing_orders', 'purchasing_requests', 'inventory_operations', 'billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes', 'expenses_reports', 'leave_requests']
    const source = row.origin ? row.links.find((l) => l.entity === row.origin.source.entity && l.id === row.origin.source.id) : row.links.find((l) => precise.includes(l.entity)) || row.links[0]
    let type = row.theme
    if (!type && source) {
      const key = `${source.entity}:${source.id}`
      if (!cache.has(key)) cache.set(key, theme(require(`${__hooks}/lib/ged-common.js`).get(e.app, source.entity, source.id)))
      type = cache.get(key)
    }
    row.theme = type || 'other'
    row.type_label = labels[row.theme]
    row.source_label = source ? `${labels[row.theme]} · ${source.label}` : 'Dépôts sans pièce liée'
    row.source_key = source ? `${row.theme}:${source.entity}:${source.id}` : 'source:none'
  },
}
