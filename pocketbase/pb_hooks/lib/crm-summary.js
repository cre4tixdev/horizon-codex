module.exports = (event) => {
  const { params, conditions, preparation } = require(`${__hooks}/lib/crm-list-query.js`)(event)
  const group = preparation ? 't.status' : 'o.stage'
  // A fractional seed makes DynamicModel infer float64 for monetary SQL sums.
  const rows = arrayOf(new DynamicModel({ stage: '', currency: '', count: 0, amount: 0.1 }))
  event.app.db().newQuery(`SELECT ${group} AS stage, o.currency, COUNT(*) AS count, SUM(o.estimated_value) AS amount FROM crm_opportunities o LEFT JOIN contacts_companies c ON c.id = o.company LEFT JOIN crm_tenders t ON t.opportunity = o.id WHERE ${conditions.join(' AND ')} GROUP BY ${group}, o.currency`).bind(params).all(rows)
  return event.json(200, { items: rows })
}
