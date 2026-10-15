const b = require(`${__hooks}/lib/billing-common.js`)
const context = (app, id, exclude = '') => {
  let quantity = 0, amount = 0
  for (const line of app.findRecordsByFilter('billing_invoice_lines', 'source_line = {:id}', '', 0, 0, { id })) {
    const parent = b.get(app, 'billing_invoices', line.getString('invoice'))
    if (parent.id === exclude || parent.getString('status') === 'cancelled' || parent.getString('invoice_kind') === 'deposit') continue
    quantity += line.getFloat('quantity'); amount += b.cents(line.getFloat('base_total'))
  }
  for (const line of app.findRecordsByFilter('billing_credit_note_lines', 'source_line = {:id}', '', 0, 0, { id })) {
    const parent = b.get(app, 'billing_credit_notes', line.getString('credit_note'))
    if (parent.getString('status') !== 'validated' || b.get(app, 'billing_invoices', parent.getString('source_invoice')).getString('invoice_kind') === 'deposit') continue
    quantity -= line.getFloat('quantity'); amount -= b.cents(line.getFloat('base_total'))
  }
  return { quantity, amount }
}
module.exports = {
  context,
  price(app, source, line, exclude = '') {
    if (!source.revision) return line.unit_price
    const covered = context(app, line.id, exclude), remaining = line.quantity - covered.quantity
    if (remaining <= 0.000001) return line.unit_price
    const balance = b.cents(line.quantity * line.unit_price) - covered.amount
    if (balance < 0) throw new BadRequestError('Le montant de commande est inférieur aux montants déjà facturés. Préparez la régularisation avant de poursuivre.')
    return Math.round(balance / 100 / remaining * 1000000) / 1000000
  },
}
