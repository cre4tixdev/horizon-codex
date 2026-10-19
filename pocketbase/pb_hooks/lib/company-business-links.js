// Contacts assembles links using GED's owner-scoped candidate queries and source policy.
module.exports = (e) => {
  const id = e.request.pathValue('id'), activity = require(`${__hooks}/lib/activity-feed.js`), scope = require(`${__hooks}/lib/ged-scope.js`), c = require(`${__hooks}/lib/ged-common.js`)
  activity.describeSource(e, 'contacts_companies', id)
  const result = {}, seen = new Set()
  for (const space of ['customers', 'suppliers']) {
    const selection = scope.scope(e, { space, context_id: id })
    for (const entity of selection.allowed.filter((entity) => !['contacts_companies', 'contacts_people', 'leave_requests'].includes(entity))) {
      for (const record of scope.business(e, entity, selection, '1')) {
        const key = entity + '/' + record.id
        if (seen.has(key)) continue
        seen.add(key)
        try {
          const link = activity.describeSource(e, entity, record.id), group = entity === 'sales_quotes' && record.getString('status') === 'accepted' ? 'sales-orders' : entity === 'inventory_operations' ? record.getString('kind') === 'IN' ? 'receipts' : record.getString('kind') === 'OUT' || record.getString('kind') === 'PREP' ? 'deliveries' : 'stock' : ({ crm_opportunities: 'opportunities', crm_tenders: 'tenders', sales_quotes: 'quotes', purchasing_orders: 'purchase-orders', purchasing_requests: 'requests', billing_invoices: 'customer-invoices', billing_supplier_invoices: 'supplier-invoices', billing_credit_notes: 'customer-credits', billing_supplier_credit_notes: 'supplier-credits', expenses_reports: 'expenses' })[entity]
          if (group) (result[group] ||= []).push({ label: link.label, href: link.href, reference: ({ draft: 'Brouillon', validated: 'Validée', sent: 'Envoyé', accepted: 'Commande client', confirmed: 'Confirmée', done: 'Réalisé', cancelled: 'Annulé', open: 'Ouverte', won: 'Gagnée', completed: 'Terminée', lost: 'Perdue', submitted: 'À valider', returned: 'À corriger', reimbursed: 'Remboursée', transit: 'En transit' })[record.getString('status')] || record.getString('status') })
        } catch (error) { if (!c.denied(error)) throw error }
      }
    }
  }
  return e.json(200, result)
}
