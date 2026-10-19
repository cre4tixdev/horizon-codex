module.exports = (e, c) => {
  c.guard(e.app, e.auth)
  const app = e.app, user = e.auth, q = e.requestInfo().query, scope = user.getString('expenses_scope')
  if (!['reports', 'all'].includes(scope)) throw new ForbiddenError('Le suivi d’équipe est réservé au périmètre manager ou global.')
  if (Object.keys(q).some((key) => !['area', 'view', 'month', 'q', 'status', 'state', 'sort', 'group', 'page', 'perPage'].includes(key))) throw new BadRequestError('Critère de suivi invalide.')
  const math = require(`${__hooks}/lib/expenses-overview-math.js`), range = math.period(q.view || 'month', q.month || c.today().slice(0, 7))
  if (!range || q.area && q.area !== 'team' || q.state && !['active', 'archived'].includes(q.state) || q.group && !['none', 'team', 'employee'].includes(q.group)) throw new BadRequestError('Période ou présentation invalide.')
  const statuses = (q.status || '').split(',').filter(Boolean), allowed = [...Object.keys(c.statuses), 'missing', 'future', 'off', 'mixed']
  if (statuses.some((status) => !allowed.includes(status))) throw new BadRequestError('État de suivi invalide.')
  const perPage = require(`${__hooks}/lib/list-page-size.js`)(q.perPage, 30), search = c.text(q.q || '', 200).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr'), archived = q.state === 'archived'
  const bounded = (collection, filter, params, sort = '') => { const records = app.findRecordsByFilter(collection, filter, sort, 10001, 0, params); if (records.length > 10000) throw new BadRequestError('Trop de données. Choisissez une période plus courte.'); return records }
  const reports = bounded('expenses_reports', 'month >= {:start} && month <= {:end}' + (archived ? ' && archived_at != ""' : ' && archived_at = ""') + (scope === 'all' ? '' : ' && validator = {:user} && user != {:user} && submitted_at != "" && status != "draft"'), { start: range.start, end: range.end, user: user.id }, 'month,created,id')
  const employees = new Map()
  if (!archived && (scope === 'all' || user.getString('employee'))) for (const employee of bounded('hr_employees', 'status = "active" && (start_date = "" || start_date <= {:end}) && (end_date = "" || end_date >= {:start})' + (scope === 'all' ? '' : ' && manager = {:manager} && id != {:manager}'), { start: range.start + '-01', end: range.end + '-31', manager: user.getString('employee') })) employees.set(employee.id, employee)
  const byEmployee = new Map()
  for (const report of reports) {
    const id = report.getString('employee')
    if (!employees.has(id)) employees.set(id, c.get(app, 'hr_employees', id))
    if (!byEmployee.has(id)) byEmployee.set(id, [])
    byEmployee.get(id).push(report)
  }
  const teams = new Map(), today = c.today().slice(0, 7), rows = []
  for (const [id, employee] of employees) {
    const teamId = employee.getString('team')
    if (teamId && !teams.has(teamId)) teams.set(teamId, c.get(app, 'core_teams', teamId).getString('name'))
    const notes = byEmployee.get(id) || [], name = `${employee.getString('first_name')} ${employee.getString('last_name')}`.trim()
    const cells = range.periods.map((month) => math.cell(month, notes.filter((report) => report.getString('month') === month).map((report) => ({ id: report.id, status: report.getString('status'), total: report.getFloat('total'), supplement: Boolean(report.getString('supplement_of')) })), today, employee.getString('start_date'), employee.getString('end_date'))).map((cell) => archived && !cell.reports.length ? { ...cell, status: 'off' } : cell)
    const row = { employee: id, employee_name: name, team: teamId, team_name: teams.get(teamId) || '', cells, total: math.sum(cells.map((cell) => cell.total)), sort_name: `${employee.getString('last_name')} ${employee.getString('first_name')}` }
    if (!search || `${name} ${row.team_name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').includes(search)) rows.push(row)
  }
  const summary = { submitted: 0, returned: 0, validated: 0, reimbursed: 0, missing: 0, total: math.sum(rows.map((row) => row.total)) }
  for (const row of rows) for (const cell of row.cells) { if (cell.status === 'missing') summary.missing++; for (const report of cell.reports) if (Object.prototype.hasOwnProperty.call(summary, report.status) && report.status !== 'total') summary[report.status]++ }
  const filtered = rows.filter((row) => !statuses.length || row.cells.some((cell) => statuses.includes(cell.status) || cell.reports.some((report) => statuses.includes(report.status))))
  const sort = q.sort || 'employee', fields = ['employee', 'team', 'total']
  if (!fields.includes(sort.replace(/^-/, ''))) throw new BadRequestError('Tri de suivi invalide.')
  require(`${__hooks}/lib/list-sorting.js`).rows(filtered, sort, fields, 'employee', (row, field) => field === 'employee' ? row.sort_name : field === 'team' ? row.team_name : row.total)
  const totalItems = filtered.length, totalPages = Math.max(1, Math.ceil(totalItems / perPage)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.page)) || 1))
  return e.json(200, { view: q.view || 'month', start: range.start, end: range.end, periods: range.periods, summary, items: filtered.slice((page - 1) * perPage, page * perPage).map((row) => ({ employee: row.employee, employee_name: row.employee_name, team: row.team, team_name: row.team_name, cells: row.cells, total: row.total })), page, totalItems, totalPages, global: scope === 'all' })
}
