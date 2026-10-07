module.exports = (event) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, false, 'crm')) throw new ForbiddenError('Accès CRM refusé.')
  const query = event.request.url.query()
  const state = query.get('state') || 'active'
  const status = query.get('status') || ''
  const search = String(query.get('q') || '').trim()
  if (!['active', 'archived'].includes(state) || status && !['open', 'won', 'completed', 'lost', 'cancelled'].includes(status) || search.length > 200) throw new BadRequestError('Filtres CRM invalides.')
  const params = { active: state === 'active' }
  const conditions = ['o.active = {:active}']
  if (status) { params.status = status; conditions.push('o.status = {:status}') }
  for (const field of ['company', 'owner']) {
    const id = query.get(field)
    if (!id) continue
    if (!/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Référence CRM invalide.')
    params[field] = id; conditions.push(`o.${field} = {:${field}}`)
  }
  search.split(/\s+/).filter(Boolean).forEach((term, index) => { params[`q${index}`] = `%${term}%`; conditions.push(`(o.title LIKE {:q${index}} OR o.opportunity_number LIKE {:q${index}} OR c.name LIKE {:q${index}})`) })
  const rows = arrayOf(new DynamicModel({ stage: '', currency: '', count: 0, amount: 0 }))
  event.app.db().newQuery(`SELECT o.stage, o.currency, COUNT(*) AS count, SUM(o.estimated_value) AS amount FROM crm_opportunities o LEFT JOIN contacts_companies c ON c.id = o.company WHERE ${conditions.join(' AND ')} GROUP BY o.stage, o.currency`).bind(params).all(rows)
  return event.json(200, { items: rows })
}
