// Purchasing owns the restricted public projection consumed by Documents.
module.exports = (app, user, id) => {
  const c = require(`${__hooks}/lib/purchasing-common.js`); c.guard(app, user)
  const record = c.get(app, 'purchasing_orders', id), stored = JSON.parse(record.getString('document_snapshot') || 'null'), order = record.getString('status') !== 'draft' && stored ? stored : c.dto(app, user, 'order', record)
  const client = order.supplier_fields ? { fields: order.supplier_fields, warnings: [] } : require(`${__hooks}/lib/contacts-document-context.js`)(app, c.get(app, 'contacts_companies', order.supplier))
  const fields = { ...client.fields }
  for (const key of ['number', 'title', 'document_date', 'needed_date', 'currency', 'subtotal', 'tax_rate', 'tax', 'total', 'notes']) fields[`purchase.${key}`] = order[key]
  // Compatibility data for the shared table formatter / legacy total blocks.
  for (const key of ['currency', 'subtotal', 'tax_rate', 'tax', 'total']) fields[`quote.${key}`] = order[key]
  const canCrm = c.policy.permissions(app, user).includes('crm.read')
  fields['opportunity.number'] = canCrm ? [...new Set(order.lines.flatMap((line) => line.allocations.map((item) => item.code)))].join(' · ') : ''
  fields['opportunity.title'] = canCrm ? order.opportunity_name || '' : ''
  fields['owner.name'] = order.owner_name || ''; fields['purchase.buyer_name'] = order.owner_name || ''; fields['purchase.buyer_email'] = order.owner_email || ''; fields['purchase.delivery_warehouse'] = order.delivery_warehouse_name || ''; fields['purchase.delivery_warehouse_code'] = order.delivery_warehouse_code || ''
  return { fields, lines: order.lines.map((line) => ({ ...line, kind: 'item', is_option: false, show_total: false })), warnings: client.warnings }
}
