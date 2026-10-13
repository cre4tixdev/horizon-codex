// Purchasing owns the supplier order projection and its analytical allocations.
module.exports = (app, id) => {
  const c = require(`${__hooks}/lib/purchasing-common.js`), order = c.get(app, 'purchasing_orders', id)
  if (['draft', 'cancelled'].includes(order.getString('status')) || order.getString('archived_at')) throw new BadRequestError('Choisissez une commande fournisseur validée active.')
  return { id: order.id, order: order.id, number: order.getString('number'), company: order.getString('supplier'), currency: order.getString('currency'), lines: c.rows(app, 'order', id).map((line) => ({ id: line.id, kind: 'item', product: line.getString('product'), description: line.getString('description'), reference: line.getString('reference'), quantity: line.getFloat('quantity'), unit: line.getString('unit'), unit_price: line.getFloat('unit_price') * (1 - line.getFloat('discount') / 100), tax_rate: line.getFloat('tax_rate'), analytic_allocations: c.allocations(app, 'order', line).map((item) => ({ analytic_account: item.analytic_account, percentage: item.percentage || (line.getFloat('quantity') ? item.quantity / line.getFloat('quantity') * 100 : 0) })) })) }
}
