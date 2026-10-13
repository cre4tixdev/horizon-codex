// Sales owns the snapshot of a confirmed customer order used by stock and Purchasing.
module.exports = (app, user, quoteId) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'sales')) throw new ForbiddenError('Accès à la commande client nécessaire.')
  return module.exports.deliverySource(app, quoteId)
}

// Internal, read-only snapshot boundary for receipt-driven stock automation.
// Public stock routes must still check the caller's Sales permission.
module.exports.deliverySource = (app, quoteId) => {
  const quote = app.findRecordById('sales_quotes', quoteId)
  const order = app.findRecordsByFilter('sales_orders', 'quote = {:id} && status = "confirmed"', '-order_sequence', 1, 0, { id: quote.id })[0]
  if (quote.getString('status') !== 'accepted' || !order || quote.getString('archived_at')) throw new BadRequestError('Choisissez une commande client active confirmée.')
  return { quote, order, destination: app.findRecordById('contacts_companies', order.getString('company') || quote.getString('company')).getString('name'), lines: app.findRecordsByFilter('sales_order_lines', 'order = {:id} && kind = "item"', 'position', 0, 0, { id: order.id }) }
}

module.exports.sourceNumber = (app, user, orderId) => {
  if (!require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('sales.read') || !orderId) return ''
  const order = app.findRecordById('sales_orders', orderId)
  return app.findRecordById('sales_quotes', order.getString('quote')).getString('quote_number')
}

module.exports.purchaseSource = (app, user, quoteId) => {
  if (!require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('sales.read')) throw new ForbiddenError('Accès aux devis nécessaire.')
  const quote = app.findRecordById('sales_quotes', quoteId)
  if (quote.getString('archived_at') || !['draft', 'validated', 'sent', 'accepted'].includes(quote.getString('status'))) throw new BadRequestError('Choisissez un devis actif.')
  return { id: quote.id, number: quote.getString('quote_number'), opportunity: quote.getString('opportunity'), currency: quote.getString('currency') }
}
module.exports.purchaseSourceNumber = (app, user, quoteId) => {
  if (!quoteId || !require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('sales.read')) return ''
  return app.findRecordById('sales_quotes', quoteId).getString('quote_number')
}

module.exports.confirmationPreview = (app, user, quoteId) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'sales')) throw new ForbiddenError('Accès au devis nécessaire.')
  const quote = app.findRecordById('sales_quotes', quoteId)
  if (quote.getString('archived_at') || !['validated', 'sent'].includes(quote.getString('status'))) throw new BadRequestError('Choisissez un devis finalisé actif.')
  return { quote, order: null, lines: app.findRecordsByFilter('sales_quote_lines', 'quote = {:id} && kind = "item" && is_option = false', 'position', 0, 0, { id: quote.id }) }
}
