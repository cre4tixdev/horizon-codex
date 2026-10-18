// Core/HR-owned dated capacities and rates. Time consumes snapshots, never salary data.
const c = require(`${__hooks}/lib/time-common.js`)
const profile = (app, employee, date) => c.all(app, 'core_resource_profiles', 'employee = {:employee} && active = true && valid_from <= {:date} && (valid_to = "" || valid_to >= {:date})', { employee, date })[0]
module.exports = {
  photo(e) {
    c.guard(e.app, e.auth)
    const id = e.request.pathValue('id'), employee = c.get(e.app, 'hr_employees', id), own = e.auth.getString('employee') === id
    const teamVisible = ['reports', 'all'].includes(e.auth.getString('time_scope')) && module.exports.beEmployees(e.app, e.auth).some((r) => r.id === id) && require(`${__hooks}/lib/hr-time-policy.js`).eligibility(e.app, employee).eligible
    const historical = !own && ['reports', 'all'].includes(e.auth.getString('time_scope')) && c.all(e.app, 'time_sheets', 'employee = {:employee} && status != "draft"' + (e.auth.getString('time_scope') === 'all' ? '' : ' && manager = {:user}'), { employee: id, user: e.auth.id }, 'id', 1).length
    if (!own && !teamVisible && !historical) throw new ForbiddenError('Photo hors de votre périmètre TimeReport.')
    return require(`${__hooks}/lib/identity-photo.js`).serveRecord(e, employee)
  },
  calendar(app, employee, start, end) {
    const profiles = c.all(app, 'core_resource_profiles', 'employee = {:employee} && active = true && valid_from <= {:end} && (valid_to = "" || valid_to >= {:start})', { employee, start, end }, '-valid_from,id')
    return require(`${__hooks}/lib/leave.js`).timeCalendar(app, employee, start, end).map((day) => {
      const r = profiles.find((p) => p.getString('valid_from') <= day.date && (!p.getString('valid_to') || p.getString('valid_to') >= day.date))
      const capacity = r ? c.json(r, 'weekly_pattern', [])[((new Date(day.date).getUTCDay() + 6) % 7)] ?? null : null
      return { ...day, capacity_minutes: capacity === null ? null : day.holiday ? 0 : Math.round(capacity * (1 - day.absent)), be_capacity: Boolean(r && c.json(r, 'work_types', ['be']).includes('be')) }
    })
  },
  capacity(app, employee, date) { const r = profile(app, employee, date); return r ? c.json(r, 'weekly_pattern', [])[((new Date(date).getUTCDay() + 6) % 7)] ?? null : null },
  cost(app, employee, date, minutes) {
    const r = profile(app, employee, date), id = r?.getString('cost_profile')
    if (!id) return { status: 'not_supplied' }
    const rate = c.get(app, 'core_cost_profiles', id)
    if (rate.getString('effective_from') > date || rate.getString('effective_to') && rate.getString('effective_to') < date) return { status: 'not_supplied' }
    return { status: 'supplied', profile: id, resource_profile: r.id, hourly_cost: rate.getFloat('hourly_cost'), currency: rate.getString('currency'), amount: Math.round(rate.getFloat('hourly_cost') * minutes / 60 * 100) / 100 }
  },
  beEmployees(app, user) {
    c.guard(app, user); if (!['reports', 'all'].includes(user.getString('time_scope'))) throw new ForbiddenError('Vue équipe refusée.')
    if (user.getString('time_scope') === 'reports' && !user.getString('employee')) return []
    return c.all(app, 'hr_employees', user.getString('time_scope') === 'all' ? 'status = "active" && id != {:own}' : 'status = "active" && manager = {:own}', { own: user.getString('employee') }, 'last_name,first_name,id').filter((r) => r.id !== user.getString('employee'))
  },
  beExpected(app, employee, start) { if (!require(`${__hooks}/lib/hr-time-policy.js`).be(app, c.get(app, 'hr_employees', employee))) return false; return Array.from({ length: 7 }, (_, i) => c.math.addDays(start, i)).some((date) => { const r = profile(app, employee, date); return r && c.json(r, 'work_types', ['be']).includes('be') && module.exports.capacity(app, employee, date) > 0 }) },
  list(app, user) { c.guard(app, user, 'settings'); return c.all(app, 'core_resource_profiles', '', {}, '-valid_from,id').map((r) => ({ id: r.id, employee: r.getString('employee'), employee_name: c.name(app, r.getString('employee')), valid_from: r.getString('valid_from'), valid_to: r.getString('valid_to'), weekly_pattern: c.json(r, 'weekly_pattern', []), work_types: c.json(r, 'work_types', ['be']), ...(c.can(app, user, 'costs') ? { hourly_cost: r.getString('cost_profile') ? c.get(app, 'core_cost_profiles', r.getString('cost_profile')).getFloat('hourly_cost') : null } : {}) })) },
  save(app, u, b) {
    c.guard(app, u, 'settings'); c.fields(b, ['employee', 'valid_from', 'weekly_pattern', 'hourly_cost', 'work_types'])
    c.get(app, 'hr_employees', b.employee)
    const workTypes = b.work_types || ['be']; if (!Array.isArray(workTypes) || !workTypes.length || new Set(workTypes).size !== workTypes.length || workTypes.some((v) => !['be', 'production'].includes(v))) throw new BadRequestError('Périmètre BE / PROD invalide.')
    if (!c.math.valid(b.valid_from) || !Array.isArray(b.weekly_pattern) || b.weekly_pattern.length !== 7) throw new BadRequestError('Date et sept capacités journalières nécessaires.')
    c.safe(() => b.weekly_pattern.forEach(c.math.minutes))
    const rates = c.all(app, 'core_resource_profiles', 'employee = {:employee} && active = true', { employee: b.employee }, '-valid_from,id')
    if (rates.some((r) => r.getString('valid_from') >= b.valid_from)) throw new BadRequestError('La nouvelle période doit commencer après les périodes existantes.')
    if (b.hourly_cost !== undefined && !c.can(app, u, 'costs')) throw new ForbiddenError('Gestion des coûts refusée.')
    if (b.hourly_cost !== undefined && b.hourly_cost !== null && (typeof b.hourly_cost !== 'number' || !Number.isFinite(b.hourly_cost) || b.hourly_cost < 0 || b.hourly_cost > 100000)) throw new BadRequestError('Coût horaire invalide.')
    let rateId = ''
    if (b.hourly_cost !== undefined && b.hourly_cost !== null) {
      const rate = new Record(app.findCollectionByNameOrId('core_cost_profiles'))
      for (const [key, value] of Object.entries({ code: `TIME-${b.employee}-${b.valid_from}`, label: 'Profil ressource', hourly_cost: b.hourly_cost, currency: 'EUR', effective_from: b.valid_from })) rate.set(key, value)
      rate.set('__resource_operation', true); app.save(rate); rateId = rate.id
    } else if (!c.can(app, u, 'costs')) rateId = rates[0]?.getString('cost_profile') || ''
    for (const previous of rates.filter((r) => !r.getString('valid_to') || r.getString('valid_to') >= b.valid_from)) { const before = previous.publicExport(); previous.set('valid_to', c.math.addDays(b.valid_from, -1)); previous.set('__resource_operation', true); app.save(previous); require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_resource_profiles', previous.id, u.id, before, previous.publicExport(), 'update') }
    const r = new Record(app.findCollectionByNameOrId('core_resource_profiles'))
    for (const [key, value] of Object.entries({ employee: b.employee, valid_from: b.valid_from, weekly_pattern: b.weekly_pattern, work_types: workTypes, cost_profile: rateId, active: true })) r.set(key, value)
    r.set('__resource_operation', true); app.save(r); require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_resource_profiles', r.id, u.id, null, r.publicExport(), 'create')
  },
}
