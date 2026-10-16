// Inventory owns the references exposed when Sales cannot withdraw an order.
module.exports = (app, user, quote) => {
  const records = app.findRecordsByFilter('inventory_operations', 'sales_quote = {:id} && status != "cancelled"', 'created,id', 0, 0, { id: quote })
  if (!records.length) return []
  if (!require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('inventory.read')) return [{ message: 'Une opération de stock liée bloque ce retour. Un accès Stock est nécessaire pour consulter son détail.', href: '', label: '' }]
  const kinds = { IN: 'Réception', OUT: 'Livraison', PREP: 'Préparation', RET: 'Retour', INT: 'Transfert', INV: 'Inventaire' }
  return records.map((record) => {
    const status = record.getString('status')
    const reason = status === 'draft' ? 'Brouillon : annulez cette préparation avant de revenir en devis.' : status === 'done' ? 'Réalisée : le mouvement doit être conservé. Utilisez Modifier la commande pour faire évoluer la commande.' : status === 'transit' ? 'En transit : cette opération en cours doit conserver son historique.' : 'En cours : cette opération bloque le retour en devis.'
    return { message: `${kinds[record.getString('kind')] || 'Opération de stock'} · ${reason}`, href: `/inventory/operations/${record.id}`, label: require(`${__hooks}/lib/stock-operation-number.js`)(app, record) }
  })
}
