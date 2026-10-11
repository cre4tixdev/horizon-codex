module.exports = (app, user, id) => {
  const c = require(`${__hooks}/lib/purchasing-common.js`); require(`${__hooks}/lib/stock.js`).guard(app, user)
  const record = c.get(app, 'inventory_operations', id), rights = c.policy.permissions(app, user), items = JSON.parse(record.getString('lines') || '[]'), fields = {}, labels = { IN: 'BON DE RÉCEPTION', OUT: record.getBool('scrap') ? 'MISE AU REBUT' : 'BON DE LIVRAISON', PREP: 'PRÉPARATION CHANTIER', RET: 'BON DE RETOUR', INT: 'TRANSFERT INTERNE', INV: 'INVENTAIRE' }
  for (const key of ['number', 'title', 'document_date', 'planned_date', 'destination']) fields[`stock.${key}`] = record.getString(key)
  fields['stock.label'] = labels[record.getString('kind')]; fields['stock.warehouse'] = c.get(app, 'inventory_warehouses', record.getString('warehouse')).getString('name')
  fields['stock.state'] = record.getString('status') === 'done' ? 'Réalisé' : record.getString('status') === 'transit' ? 'En transit' : 'Brouillon'; fields['quote.currency'] = 'EUR'
  if (rights.includes('crm.read') && record.getString('opportunity')) { const opportunity = c.get(app, 'crm_opportunities', record.getString('opportunity')); fields['opportunity.number'] = opportunity.getString('opportunity_number'); fields['opportunity.title'] = opportunity.getString('title') }
  const details = require(`${__hooks}/lib/stock-operation-details.js`)(app, record)
  fields['stock.purchase_number'] = details.purchase_number; fields['stock.supplier_name'] = details.supplier_name; fields['stock.supplier_address'] = details.supplier_address; fields['_line_details'] = details.line_details
  const snapshot = JSON.parse(record.getString('document_snapshot') || 'null'); if (snapshot) { for (const [key, value] of Object.entries(snapshot)) if (!key.startsWith('opportunity.') || rights.includes('crm.read')) fields[key] = value }; fields['stock.state'] = record.getString('status') === 'done' ? 'Réalisé' : record.getString('status') === 'transit' ? 'En transit' : 'Brouillon'
  const warnings = []
  if (record.getString('status') !== 'done') warnings.push('Pièce en préparation : les quantités ne constituent pas une réalisation.')
  return { fields, warnings, lines: items.map((line) => ({ ...line, ...details.line_details.find((item) => item.id === line.id), unit_cost: 0, allocations: [], kind: 'item', is_option: false, show_total: false, unit_price: 0, discount: 0, line_total: 0 })) }
}
