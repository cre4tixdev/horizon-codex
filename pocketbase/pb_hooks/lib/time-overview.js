const c = require(`${__hooks}/lib/time-common.js`)
const resources = require(`${__hooks}/lib/hr-time-resources.js`)
const hr = require(`${__hooks}/lib/hr-time-policy.js`)
const endOfMonth = (date) => new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0)).toISOString().slice(0, 10)
const week = (date) => c.math.monday(date)
const states = ['missing', 'draft', 'submitted', 'validated', 'rejected', 'mixed', 'future', 'off', 'unknown', 'unavailable']
module.exports = (e) => {
  c.guard(e.app, e.auth)
  const app = e.app, u = e.auth, q = e.request.url.query(), area = q.get('area') || 'own', view = q.get('view') || 'month', date = q.get('date'), today = c.today()
  if (!['own', 'review'].includes(area) || !['week', 'month', 'quarter', 'year'].includes(view) || !c.math.valid(date || '') || !/^20\d{2}-/.test(date)) throw new BadRequestError('Période TimeReport invalide.')
  if (area === 'review' && !['reports', 'all'].includes(u.getString('time_scope'))) throw new ForbiddenError('Vue équipe refusée.')
  const quarterStart = `${date.slice(0, 4)}-${String(Math.floor((Number(date.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0')}-01`
  const quarterEnd = endOfMonth(new Date(Date.UTC(Number(quarterStart.slice(0, 4)), Number(quarterStart.slice(5, 7)) + 1, 1)).toISOString().slice(0, 10))
  const start = view === 'quarter' ? quarterStart : view === 'week' ? week(date) : view === 'year' ? date.slice(0, 4) + '-01-01' : date.slice(0, 7) + '-01', end = view === 'quarter' ? quarterEnd : view === 'week' ? c.math.addDays(start, 6) : view === 'year' ? date.slice(0, 4) + '-12-31' : endOfMonth(date)
  const periods = []
  if (view === 'week') for (let day = start; day <= end; day = c.math.addDays(day, 1)) periods.push({ key: day, start: day, end: day })
  if (view === 'month') for (let day = week(start); day <= end; day = c.math.addDays(day, 7)) periods.push({ key: day, start: day < start ? start : day, end: c.math.addDays(day, 6) > end ? end : c.math.addDays(day, 6) })
  if (view === 'year' || view === 'quarter') for (let month = Number(start.slice(5, 7)); month <= Number(end.slice(5, 7)); month++) { const first = start.slice(0, 4) + '-' + String(month).padStart(2, '0') + '-01'; periods.push({ key: first.slice(0, 7), start: first, end: endOfMonth(first) }) }
  const scope = area === 'own' ? 'user = {:user}' : u.getString('time_scope') === 'all' ? 'user != {:user} && status != "draft"' : 'manager = {:user} && user != {:user} && status != "draft"'
  const sheets = c.all(app, 'time_sheets', `(${scope}) && week_start >= {:start} && week_start <= {:end}`, { user: u.id, start: week(start), end }, 'week_start,id')
  const employees = new Map()
  if (area === 'review') { for (const employee of resources.beEmployees(app, u)) if (hr.eligibility(app, employee).eligible) employees.set(employee.id, employee) }
  if (area === 'own' && u.getString('employee')) { const employee = c.get(app, 'hr_employees', u.getString('employee')); if (hr.eligibility(app, employee).eligible) employees.set(employee.id, employee) }
  for (const sheet of sheets) if (!employees.has(sheet.getString('employee'))) employees.set(sheet.getString('employee'), c.get(app, 'hr_employees', sheet.getString('employee')))
  const search = c.text(q.get('q') || '', 200).toLocaleLowerCase('fr'), statuses = (q.get('status') || '').split(',').filter(Boolean)
  if (statuses.some((status) => !states.includes(status))) throw new BadRequestError('État invalide.')
  const rows = [], missingWeeks = new Set()
  for (const [id, employee] of employees) {
    const team = employee.getString('team') ? c.get(app, 'core_teams', employee.getString('team')) : null, name = c.name(app, id), eligibility = hr.eligibility(app, employee)
    const ownSheets = sheets.filter((s) => s.getString('employee') === id)
    const days = resources.calendar(app, id, start, end)
    // Only entries attached to readable sheets are queried. No descriptions or costs are returned.
    const times = c.all(app, 'time_entries', `employee = {:employee} && date >= {:start} && date <= {:end} && (${area === 'own' ? 'sheet.user = {:user}' : u.getString('time_scope') === 'all' ? 'sheet.user != {:user} && sheet.status != "draft"' : 'sheet.manager = {:user} && sheet.user != {:user} && sheet.status != "draft"'})`, { employee: id, start, end, user: u.id }, 'date,id')
    const dayMinutes = new Map(), sheetsByWeek = new Map(ownSheets.map((sheet) => [sheet.getString('week_start'), sheet]))
    for (const entry of times) { const day = entry.getString('date'); dayMinutes.set(day, (dayMinutes.get(day) || 0) + entry.getInt('duration_minutes')) }
    // A sheet entrusted to another manager is outside this review, not a missing submission.
    const elsewhere = area === 'review' && u.getString('time_scope') !== 'all' ? new Set(c.all(app, 'time_sheets', 'employee = {:employee} && week_start >= {:start} && week_start <= {:end} && status != "draft" && manager != {:user}', { employee: id, start: week(start), end, user: u.id }).map((s) => s.getString('week_start'))) : new Set()
    const cells = periods.map((period) => {
      const available = days.filter((d) => d.date >= period.start && d.date <= period.end), visible = ownSheets.filter((s) => s.getString('week_start') <= period.end && c.math.addDays(s.getString('week_start'), 6) >= period.start)
      const expected = new Set(available.filter((d) => eligibility.eligible && eligibility.work_type === 'be' && d.be_capacity && d.capacity_minutes > 0 && d.date <= today && !elsewhere.has(week(d.date))).map((d) => week(d.date)))
      for (const w of expected) if (!visible.some((s) => s.getString('week_start') === w)) missingWeeks.add(`${id}:${w}`)
      const visibleWeeks = new Set(visible.map((s) => s.getString('week_start'))), missing = [...expected].filter((w) => !visibleWeeks.has(w)).length
      const minutes = available.reduce((n, day) => n + (dayMinutes.get(day.date) || 0), 0)
      const capacity = available.some((d) => d.capacity_minutes === null) ? null : available.reduce((n, d) => n + d.capacity_minutes, 0)
      const statuses = new Set(visible.map((s) => s.getString('status')))
      const total = new Set([...expected, ...visibleWeeks]).size, validated = visible.filter((s) => s.getString('status') === 'validated').length
      let status = eligibility.work_type === 'production' ? 'unavailable' : period.start > today ? 'future' : !eligibility.eligible ? 'off' : capacity === null ? 'unknown' : capacity === 0 ? 'off' : 'missing'
      if (visible.length) status = statuses.size === 1 && !missing ? [...statuses][0] : 'mixed'
      if (statuses.has('rejected')) status = 'rejected'
      if (view === 'week' && capacity === 0 && minutes === 0 && eligibility.work_type !== 'production') status = 'off'
      return { key: period.key, minutes: area === 'review' && !visible.length ? null : minutes, capacity_minutes: capacity, status, validated_weeks: validated, total_weeks: total, missing_weeks: missing, sheets: visible.map((s) => ({ id: s.id, week_start: s.getString('week_start'), status: s.getString('status') })) }
    })
    rows.push({ days: area === 'own' ? days.map((day) => ({ date: day.date, holiday: day.holiday, weekend: day.weekend, absent: day.absent, minutes: dayMinutes.get(day.date) || 0, sheet_status: sheetsByWeek.get(week(day.date))?.getString('status') || null })) : [], employee: id, has_photo: Boolean(employee.getString('avatar')), photo_revision: employee.getString('updated'), employee_name: name, team_name: team?.getString('name') || '', work_type: eligibility.work_type || '', cells, total_minutes: times.reduce((n, t) => n + t.getInt('duration_minutes'), 0), capacity_minutes: days.some((d) => d.capacity_minutes === null) ? null : days.reduce((n, d) => n + d.capacity_minutes, 0) })
  }
  const summary = { minutes: rows.reduce((n, row) => n + row.total_minutes, 0), submitted: sheets.filter((s) => s.getString('status') === 'submitted').length, validated: sheets.filter((s) => s.getString('status') === 'validated').length, rejected: sheets.filter((s) => s.getString('status') === 'rejected').length, missing: missingWeeks.size }
  const filtered = rows.filter((row) => (!search || `${row.employee_name} ${row.team_name}`.toLocaleLowerCase('fr').includes(search)) && (!statuses.length || row.cells.some((cell) => statuses.includes(cell.status) || statuses.includes('missing') && cell.missing_weeks > 0 || cell.sheets.some((sheet) => statuses.includes(sheet.status)))))
  require(`${__hooks}/lib/list-sorting.js`).rows(filtered, ['employee_name', '-employee_name', 'total_minutes', '-total_minutes', 'team_name', '-team_name'].includes(q.get('sort')) ? q.get('sort') : 'employee_name', ['employee_name', 'total_minutes', 'team_name'], 'employee_name', (row, field) => field === 'employee_name' ? `${employees.get(row.employee).getString('last_name')} ${employees.get(row.employee).getString('first_name')}` : row[field])
  const totalItems = filtered.length, totalPages = Math.max(1, Math.ceil(totalItems / 30)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.get('page'))) || 1))
  return e.json(200, { today, summary, area, view, start, end, periods, items: filtered.slice((page - 1) * 30, page * 30), totalItems, totalPages, page })
}
