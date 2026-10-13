const b = require(`${__hooks}/lib/billing-common.js`)
module.exports = (app, direction, exclude = '') => {
  const available = new Map(), parentMap = new Map(b.activeDocuments(app, direction).filter((record) => record.id !== exclude).map((record) => [record.id, record]))
  const lines = app.findAllRecords(b.config(direction).lines)
  const add = (key, amount) => available.set(key, (available.get(key) || 0) + amount)
  const creditKind = `${direction}_credit`, creditParents = new Map(app.findRecordsByFilter(b.config(creditKind).collection, 'status = "validated"', '', 0, 0).map((record) => [record.id, record]))
  for (const line of lines) { const parent = parentMap.get(line.getString(b.config(direction).parent)); if (!parent) continue
    if (parent.getString('invoice_kind') === 'deposit') add(`${parent.id}/${line.getString('source_line')}`, b.cents(line.getFloat('base_total')))
    else for (const allocation of b.json(line, 'deposit_allocations')) add(`${allocation.id}/${line.getString('source_line')}`, -b.cents(allocation.amount))
  }
  for (const line of app.findAllRecords(b.config(creditKind).lines)) { const credit = creditParents.get(line.getString(b.config(creditKind).parent)); if (!credit) continue
    const original = b.get(app, b.config(direction).collection, credit.getString('source_invoice'))
    if (original.getString('invoice_kind') === 'deposit') add(`${original.id}/${line.getString('source_line')}`, -b.cents(line.getFloat('base_total')))
    else for (const allocation of b.json(line, 'deposit_allocations')) add(`${allocation.id}/${line.getString('source_line')}`, b.cents(allocation.amount))
  }
  return { available, parents: parentMap }
}
