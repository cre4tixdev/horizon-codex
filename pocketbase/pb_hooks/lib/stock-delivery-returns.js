// Realized customer returns, keyed by the stable sales order line.
const rounded = (value) => Math.round(value * 1000000) / 1000000
module.exports = (app, quote) => {
  const totals = new Map()
  const returns = app.findRecordsByFilter('inventory_operations', 'kind = "RET" && status = "done" && origin.sales_quote = {:quote} && (origin.kind = "OUT" || origin.kind = "PREP")', '', 0, 0, { quote })
  for (const record of returns) for (const line of JSON.parse(record.getString('lines') || '[]')) { const id = line.sales_line || line.source_line; totals.set(id, rounded((totals.get(id) || 0) + line.quantity)) }
  return totals
}
