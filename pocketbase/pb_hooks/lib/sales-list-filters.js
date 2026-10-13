const values = (input, allowed, label) => {
  if (!input) return []
  const result = String(input).split(',')
  if (result.length > allowed.length || result.some((value) => !allowed.includes(value)) || new Set(result).size !== result.length) throw new BadRequestError(`${label} invalide.`)
  return result
}
module.exports = (query, parameters) => {
  let kind = query.get('kind') || '', status = query.get('status') || '', state = query.get('state') || 'active'
  const legacy = ['active', 'quotes', 'archived', 'accepted'].includes(status)
  if (legacy) {
    if (!kind && status === 'quotes') kind = 'quote'
    if (!kind && status === 'accepted') kind = 'order'
    if (status === 'archived') state = 'archived'
    status = status === 'active' ? 'draft,validated,sent' : ''
  } else if (!kind && status) kind = 'quote'
  const kinds = values(kind, ['quote', 'order'], 'Type de pièce'), statuses = values(status, ['draft', 'validated', 'sent', 'rejected', 'cancelled'], 'État des devis'), orders = values(query.get('order_status'), ['confirmed', 'in_progress', 'completed'], 'État des commandes')
  const numbers = values(query.get('customer_number'), ['provided', 'waiting'], 'N° commande client')
  if (kind === 'quote' && numbers.length) throw new BadRequestError('Le numéro de commande ne concerne que les commandes.')
  if (!['active', 'archived'].includes(state)) throw new BadRequestError('Archives invalides.')
  if (kind === 'quote' && orders.length || kind === 'order' && statuses.length) throw new BadRequestError('Le filtre d’état ne correspond pas au type de pièce.')
  const branch = (items, field, prefix) => items.map((value, index) => { const key = `${prefix}${index}`; parameters[key] = value; return `${field} {:${key}}` }).join(' || ')
  const alternatives = []
  if (!kinds.length || kinds.includes('quote')) alternatives.push(`(status != "accepted"${statuses.length ? ` && (${branch(statuses, 'status =', 'quote_status')})` : ''})`)
  if (!kinds.length || kinds.includes('order')) alternatives.push(`(status = "accepted"${orders.length ? ` && (${branch(orders, 'sales_orders_via_quote.status ?=', 'order_status')})` : ''})`)
  if (numbers.length === 1) {
    const waiting = '(sales_orders_via_quote.customer_order_number ?= "" || sales_orders_via_quote.customer_order_number ?= "Attente Commande" || sales_orders_via_quote.customer_order_number ?= "ATTENTE COMMANDE")'
    const provided = '(sales_orders_via_quote.customer_order_number ?!= "" && sales_orders_via_quote.customer_order_number ?!= "Attente Commande" && sales_orders_via_quote.customer_order_number ?!= "ATTENTE COMMANDE")'
    const index = alternatives.length - 1; alternatives[index] = `(${alternatives[index]} && ${numbers[0] === 'waiting' ? waiting : provided})`
  }
  return [state === 'archived' ? 'archived_at != ""' : 'archived_at = ""', `(${alternatives.join(' || ')})`]
}
