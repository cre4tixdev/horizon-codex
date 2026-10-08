module.exports = (event) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, false, 'crm')) throw new ForbiddenError('Accès CRM refusé.')
  const query = event.request.url.query()
  const state = query.get('state') || 'active'
  const status = query.get('status') || ''
  const search = String(query.get('q') || '').trim()
  if (!['active', 'archived'].includes(state) || status && !['open', 'won', 'completed', 'lost', 'cancelled'].includes(status) || search.length > 200) throw new BadRequestError('Filtres CRM invalides.')
  const params = { active: state === 'active' }
  const conditions = ['o.active = {:active}']
  const type = query.get('type') || ''
  if (type && !['direct', 'tender'].includes(type)) throw new BadRequestError('Type CRM invalide.')
  if (type) { params.type = type; conditions.push('o.type = {:type}') }
  if (status) { params.status = status; conditions.push('o.status = {:status}') }
  for (const field of ['company', 'owner']) {
    const id = query.get(field)
    if (!id) continue
    if (!/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Référence CRM invalide.')
    params[field] = id; conditions.push(`o.${field} = {:${field}}`)
  }
  search.split(/\s+/).filter(Boolean).forEach((term, index) => { params[`q${index}`] = `%${term}%`; conditions.push(`(o.title LIKE {:q${index}} OR o.opportunity_number LIKE {:q${index}} OR c.name LIKE {:q${index}}${type === 'tender' ? ` OR t.reference LIKE {:q${index}}` : ''})`) })
  if (query.get('preparation_status') || query.get('tag')) conditions.push('o.type = "tender" AND t.archived_at = ""')
  if (query.get('preparation_status')) { if (!/^[a-z0-9]{15}$/.test(query.get('preparation_status'))) throw new BadRequestError('Étape AO invalide.'); params.preparation = query.get('preparation_status'); conditions.push('t.status = {:preparation}') }
  if (query.get('tag')) { if (!/^[a-z0-9]{15}$/.test(query.get('tag'))) throw new BadRequestError('Tag AO invalide.'); params.tag = query.get('tag'); conditions.push('EXISTS (SELECT 1 FROM json_each(t.tags) WHERE value = {:tag})') }
  const preparation = query.get('preparation') === 'true'
  if (preparation && type !== 'tender') throw new BadRequestError('La préparation concerne les AO.')
  const group = preparation ? 't.status' : 'o.stage'
  // A fractional seed makes DynamicModel infer float64 for monetary SQL sums.
  const rows = arrayOf(new DynamicModel({ stage: '', currency: '', count: 0, amount: 0.1 }))
  event.app.db().newQuery(`SELECT ${group} AS stage, o.currency, COUNT(*) AS count, SUM(o.estimated_value) AS amount FROM crm_opportunities o LEFT JOIN contacts_companies c ON c.id = o.company LEFT JOIN crm_tenders t ON t.opportunity = o.id WHERE ${conditions.join(' AND ')} GROUP BY ${group}, o.currency`).bind(params).all(rows)
  return event.json(200, { items: rows })
}
