// Operational projection owned by Inventory; no prices or private source document.
const c = require(`${__hooks}/lib/purchasing-common.js`)
module.exports = (app, record) => {
  const snapshot = JSON.parse(record.getString('document_snapshot') || 'null')
  const identity = record.getString('purchase_order') ? require(`${__hooks}/lib/purchasing-stock-source.js`).receiptIdentity(app, record.getString('purchase_order')) : { purchase_number: '', supplier_name: '', supplier_address: '' }
  const lineDetails = JSON.parse(record.getString('lines') || '[]').map((line) => ({
    id: line.id,
    affair_tags: (line.allocations || []).map((allocation) => ({ ...require(`${__hooks}/lib/analytic-identity.js`)(app, allocation.analytic_account), quantity: allocation.quantity, unit: line.unit })),
    destination: line.to_location ? c.get(app, 'inventory_locations', line.to_location).getString('name') : '',
  }))
  for (const line of lineDetails) line.affairs = line.affair_tags.map((item) => `${item.code}${item.client ? ' - ' + item.client : ''} [ ${String(item.quantity).replace('.', ',')}${item.unit} ]`).join(' · ')
  const stored = snapshot?._line_details ? snapshot._line_details.map((line) => ({ ...line, affair_tags: line.affair_tags || lineDetails.find((item) => item.id === line.id)?.affair_tags || [] })) : lineDetails
  const affairTags = stored.flatMap((line) => line.affair_tags || []).map(({ code, client }) => ({ code, client }))
  if (!affairTags.length && record.getString('opportunity')) { const account = c.get(app, 'crm_opportunities', record.getString('opportunity')).getString('analytic_account'); if (account) affairTags.push(require(`${__hooks}/lib/analytic-identity.js`)(app, account)) }
  return { affair_tags: affairTags, purchase_number: snapshot?.['stock.purchase_number'] ?? identity.purchase_number, supplier_name: snapshot?.['stock.supplier_name'] ?? identity.supplier_name, supplier_address: snapshot?.['stock.supplier_address'] ?? identity.supplier_address, line_details: stored }
}
