module.exports = (app, user, ids) => {
  if (!require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('sales.read')) return []
  return ids.map((id) => {
    const quote = app.findRecordById('sales_quotes', id), order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status != "cancelled"', '-order_sequence', 1, 0, { id })[0]
    return { id, label: order?.getString('order_number') || quote.getString('quote_number'), reference: order?.getString('customer_order_number') || 'Attente Commande', href: `/sales/quotes/${id}` }
  })
}
