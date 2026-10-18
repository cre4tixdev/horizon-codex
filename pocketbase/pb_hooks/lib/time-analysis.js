// Time owns this read-only projection. Accounting supplies authorized analytic accounts.
// Planning remains forecast; only validated time contributes to actual hours.
const exists = (app, name) => {
  const result = new DynamicModel({ present: 0 })
  app.db().newQuery('SELECT COUNT(*) AS present FROM _collections WHERE name = {:name}').bind({ name }).one(result)
  return result.present > 0
}
const empty = () => ({ be: { planned_minutes: 0, actual_minutes: 0, pending_minutes: 0 }, production: { planned_minutes: 0, actual_minutes: 0, pending_minutes: 0 } })
const add = (target, key, value) => {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isSafeInteger(target[key] + value)) throw new BadRequestError('Durée TimeReport invalide.')
  target[key] += value
}
module.exports = (app, accounts, currency = 'EUR') => {
  const planning = exists(app, 'planning_assignments'), time = exists(app, 'time_entries')
  const costs = new Map(accounts.map((id) => [id, { cents: 0, supplied: time }]))
  const result = new Map(accounts.map((id) => [id, empty()]))
  for (const id of accounts) {
    if (planning) for (const assignment of app.findRecordsByFilter('planning_assignments', 'analytic_account = {:id}', 'id', 0, 0, { id })) {
      const work = result.get(id)[assignment.getString('work_type')]
      if (work) add(work, 'planned_minutes', assignment.getFloat('planned_minutes'))
    }
    if (time) for (const entry of app.findRecordsByFilter('time_entries', 'analytic_account = {:id}', 'id', 0, 0, { id })) {
      const work = result.get(id)[entry.getString('work_type')]
      if (!work || ['cancelled', 'rejected'].includes(entry.getString('status'))) continue
      if (entry.getString('status') === 'validated' && entry.getInt('duration_minutes') > 0) {
        const cost = (JSON.parse(entry.getString('cost_snapshot') || '{}') || {}), bucket = costs.get(id)
        if (cost.status !== 'supplied' || cost.currency !== currency || typeof cost.amount !== 'number' || !Number.isFinite(cost.amount)) bucket.supplied = false
        else { const cents = Math.round(cost.amount * 100); if (!Number.isSafeInteger(cents) || !Number.isSafeInteger(bucket.cents + cents)) throw new BadRequestError('Coût TimeReport trop important.'); bucket.cents += cents }
      }
      add(work, entry.getString('status') === 'validated' ? 'actual_minutes' : 'pending_minutes', entry.getFloat('duration_minutes'))
    }
  }
  return { planning, time, time_be: time, time_production: time && app.findRecordsByFilter('time_entries', 'work_type = "production"', 'id', 1, 0).length > 0, accounts: result, costs }
}
