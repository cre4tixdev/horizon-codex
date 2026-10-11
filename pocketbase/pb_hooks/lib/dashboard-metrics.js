// Read-only projection. Inputs are authorized and period-filtered by the server.
const aggregate = (rows, field, withMargin = false) => {
  const groups = new Map()
  for (const row of rows) {
    if (row[field] === null) continue
    const group = groups.get(row.currency) || { currency: row.currency, amount: 0, count: 0, base: 0 }
    group.amount += Math.round(row[field] * 100)
    group.base += Math.round((row.subtotal || 0) * 100)
    if (!Number.isSafeInteger(group.amount) || !Number.isSafeInteger(group.base)) throw new RangeError('Montant agrégé hors limites.')
    group.count++
    groups.set(row.currency, group)
  }
  return [...groups.values()].sort((a, b) => a.currency.localeCompare(b.currency)).map((group) => ({ currency: group.currency, amount: group.amount / 100, count: group.count, percent: withMargin && group.base ? Math.round(group.amount / group.base * 10000) / 100 : null }))
}
const trend = (rows, field, from, to) => {
  const first = new Date(`${from}T00:00:00Z`), last = Date.parse(`${to}T00:00:00Z`)
  const span = Math.round((last - first.getTime()) / 86400000) + 1
  const step = span <= 31 ? 'day' : span <= 100 ? 'week' : 'month'
  const dates = []
  for (const cursor = new Date(first); cursor.getTime() <= last;) {
    dates.push(cursor.toISOString().slice(0, 10))
    if (step === 'month') { cursor.setUTCDate(1); cursor.setUTCMonth(cursor.getUTCMonth() + 1) }
    else cursor.setUTCDate(cursor.getUTCDate() + (step === 'week' ? 7 : 1))
  }
  const groups = new Map()
  for (const row of rows) {
    if (row[field] === null || !row.date || row.date < from || row.date > to) continue
    const values = groups.get(row.currency) || dates.map(() => 0)
    let index = dates.length - 1
    while (index >= 0 && dates[index] > row.date) index--
    if (index < 0) continue
    values[index] += Math.round(row[field] * 100)
    if (!Number.isSafeInteger(values[index])) throw new RangeError('Montant agrégé hors limites.')
    groups.set(row.currency, values)
  }
  return { step, dates, series: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, values]) => ({ currency, values: values.map((value) => value / 100) })) }
}
module.exports = { aggregate, trend }
