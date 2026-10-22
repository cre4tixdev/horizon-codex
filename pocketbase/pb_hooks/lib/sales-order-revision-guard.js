const same = (left, right) => {
  if (left === right) return true
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  const keys = Object.keys(left)
  return keys.length === Object.keys(right).length && keys.every((key) => same(left[key], right[key]))
}
const json = (record, field) => JSON.parse(record.getString(field) || 'null')
const revision = (app, order) => {
  if (!order.getString('current_revision')) throw new BadRequestError('Une révision de commande est nécessaire.')
  const record = app.findRecordById('sales_order_revisions', order.getString('current_revision'))
  if (record.getString('order') !== order.id || record.getString('status') !== 'validated' || record.getInt('number') !== order.getInt('revision_number')) throw new BadRequestError('Révision de commande invalide.')
  return record
}
const fields = ['kit_key', 'kit_parent', 'kit_quantity', 'kit_print_details', 'kind', 'product', 'description', 'quantity', 'unit', 'unit_price', 'unit_cost', 'line_total', 'tax_base', 'tax_rate', 'tax_amount', 'position', 'source_line', 'snapshot']
module.exports = {
  order(app, record) {
    const proof = revision(app, record), before = record.original(), after = json(proof, 'after_snapshot')
    if (record.getInt('revision_number') !== before.getInt('revision_number') + 1 || json(proof, 'before_snapshot').order_updated !== before.getString('updated')) throw new BadRequestError('La révision ne correspond pas à la version précédente.')
    for (const field of ['owner', 'subtotal', 'tax', 'total', 'customer_order_number']) if (JSON.stringify(record.get(field)) !== JSON.stringify(after.order[field])) throw new BadRequestError('Les montants et informations doivent correspondre à la révision.')
  },
  line(app, record, remove = false) {
    const order = app.findRecordById('sales_orders', record.getString('order')), proof = revision(app, order), after = json(proof, 'after_snapshot'), line = after.lines.find((item) => item.record_id === record.id)
    if (remove) { if (line || !json(proof, 'before_snapshot').lines.some((item) => item.record_id === record.id)) throw new BadRequestError('Suppression absente de la révision.'); return }
    if (!line || fields.some((field) => !same(field === 'snapshot' ? json(record, 'snapshot') : record.get(field), field === 'snapshot' ? line : line[field]))) throw new BadRequestError('La ligne doit correspondre à la révision validée.')
  },
}
