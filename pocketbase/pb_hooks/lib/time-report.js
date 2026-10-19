const c = require(`${__hooks}/lib/time-common.js`)
const catalog = require(`${__hooks}/lib/catalog-time.js`)
const accounting = require(`${__hooks}/lib/accounting-time.js`)
const resources = require(`${__hooks}/lib/hr-time-resources.js`)
const sales = require(`${__hooks}/lib/sales-time.js`)
const week = (date) => c.safe(() => c.math.monday(date))
const findWeek = (app, employee, start) => c.all(app, 'time_sheets', 'employee = {:employee} && week_start = {:start} && work_type = "be" && source_provider = "horizon"', { employee, start })[0]
const lines = (app, sheet) => c.all(app, 'time_sheet_lines', 'sheet = {:sheet}', { sheet }, 'sort_order,id')
const entries = (app, sheet) => c.all(app, 'time_entries', 'sheet = {:sheet}', { sheet }, 'date,id')
const identity = (app, r) => ({ product: catalog.identity(app, r.getString('product')), account: accounting.identity(app, r.getString('analytic_account')) })
const calendar = (app, employee, start) => resources.calendar(app, employee, start, c.math.addDays(start, 6))
const dto = (app, u, r, start = '', emp = '') => {
  const employee = r ? r.getString('employee') : emp, first = r ? r.getString('week_start') : start, days = calendar(app, employee, first), times = r ? entries(app, r.id) : [], totals = days.map((d) => times.filter((t) => t.getString('date') === d.date).reduce((n, t) => n + t.getInt('duration_minutes'), 0))
  return { today: c.today(), id: r?.id || '', employee, employee_name: c.name(app, employee), user: r?.getString('user') || u.id, week_start: first, status: r?.getString('status') || 'draft', revision: r?.getInt('revision') || 0, manager: r?.getString('manager') || '', manager_name: r?.getString('manager') ? c.get(app, 'core_users', r.getString('manager')).getString('name') : '', decision_reason: r?.getString('decision_reason') || '', days, totals, total_minutes: totals.reduce((a, b) => a + b, 0), actions: r ? c.actions(app, u, r) : c.can(app, u, 'write') && first <= c.today() ? ['edit'] : [], lines: r ? lines(app, r.id).map((line) => {
    const snap = r.getString('status') === 'validated' ? c.json(line, 'identity_snapshot') : identity(app, line)
    return { id: line.id, product: line.getString('product'), product_label: snap.product?.label || '', product_code: snap.product?.code || '', analytic_account: line.getString('analytic_account'), account_label: snap.account?.label || '', account_code: snap.account?.code || '', sales_order_line: line.getString('sales_order_line'), context: line.getString('context'), days: days.map((day) => { const t = times.find((t) => t.getString('sheet_line') === line.id && t.getString('date') === day.date); return { minutes: t?.getInt('duration_minutes') || 0, description: t?.getString('description') || '' } }) }
  }) : [] }
}
const checkLine = (app, b, start) => {
  c.fields(b, ['id', 'product', 'analytic_account', 'sales_order_line', 'context', 'days'])
  if (!['affair', 'presales', 'internal'].includes(b.context)) throw new BadRequestError('Imputation invalide.')
  catalog.check(app, b.product); accounting.check(app, b.analytic_account, b.context); sales.check(app, b.sales_order_line || '', b.analytic_account, b.product)
  const activity = c.all(app, 'time_activities', 'product = {:product} && active = true', { product: b.product })[0]
  if (!activity || !c.json(activity, 'work_types', []).includes('be')) throw new BadRequestError('Ce service n’est pas ouvert à la saisie BE dans les paramètres.')
  if (!Array.isArray(b.days) || b.days.length !== 7) throw new BadRequestError('Sept journées attendues.')
  b.days.forEach((day, i) => { c.fields(day, ['minutes', 'description']); c.safe(() => c.math.minutes(day.minutes)); c.text(day.description || ''); const date = c.math.addDays(start, i); if (date > c.today() && (day.minutes || c.text(day.description || ''))) throw new BadRequestError('Les heures et commentaires ne peuvent pas être saisis à l’avance.'); if (day.minutes && (activity.getString('valid_from') && date < activity.getString('valid_from') || activity.getString('valid_to') && date > activity.getString('valid_to'))) throw new BadRequestError('Cette activité est hors de sa période de saisie.') })
}
const auditSnapshot = (app, r) => r ? { sheet: r.publicExport(), lines: lines(app, r.id).map((l) => l.publicExport()), entries: entries(app, r.id).map((t) => ({ ...t.publicExport(), cost_snapshot: c.json(t, 'cost_snapshot') })) } : null
const auditSheet = (app, u, r, before, label) => { require(`${__hooks}/lib/access-policy.js`).audit(app, 'time_sheets', r.id, u.id, before, auditSnapshot(app, r), before ? 'update' : 'create'); return require(`${__hooks}/lib/activity.js`).publish(app, r, u.id, 'status_change', label, {}) }
const options = (app, u) => {
  const employee = u.getString('employee') && c.get(app, 'hr_employees', u.getString('employee')).getString('status') === 'active' ? u.getString('employee') : ''
  const eligibility = require(`${__hooks}/lib/hr-time-policy.js`).eligibility(app, employee ? c.get(app, 'hr_employees', employee) : null)
  return { tracks_time: eligibility.eligible, has_history: c.all(app, 'time_sheets', 'user = {:user}', { user: u.id }, 'id', 1).length > 0, can_enter: eligibility.eligible && eligibility.work_type === 'be' && c.can(app, u, 'write'), entry_reason: eligibility.eligible && eligibility.work_type === 'production' ? 'Les temps Production seront repris depuis OnSite. La saisie Horizon est ouverte au BE.' : eligibility.reason || (!c.can(app, u, 'write') ? 'Vous disposez uniquement d’un accès en consultation aux temps.' : ''), work_type: eligibility.work_type, internal_account: accounting.internal(app), employee, employee_name: employee ? c.name(app, employee) : '', managers: c.reviewers(app, u), can_review: c.can(app, u, 'validate') && ['reports', 'all'].includes(u.getString('time_scope')), can_settings: c.can(app, u, 'settings'), can_costs: c.can(app, u, 'costs'), activities: c.all(app, 'time_activities', 'active = true').filter((r) => c.json(r, 'work_types', []).includes('be')).map((r) => { const product = catalog.identity(app, r.getString('product')); return { ...product, valid_from: r.getString('valid_from'), valid_to: r.getString('valid_to') } }), favorites: c.all(app, 'time_favorites', 'user = {:user}', { user: u.id }).map((r) => ({ id: r.id, product: r.getString('product'), analytic_account: r.getString('analytic_account'), sales_order_line: r.getString('sales_order_line'), context: r.getString('context'), ...identity(app, r) })) }
}
module.exports = {
  activitySource(app, u, id, write = false) { const r = c.read(app, u, id); if (write && !(r.getString('user') === u.id && c.can(app, u, 'write') || r.getString('manager') === u.id && c.can(app, u, 'validate'))) throw new ForbiddenError('Contribution au fil refusée.'); return r },
  choices(e) { c.guard(e.app, e.auth); return e.json(200, options(e.app, e.auth)) },
  accounts(e) { c.guard(e.app, e.auth); return e.json(200, accounting.choices(e.app, c.text(e.request.url.query().get('q') || '', 200))) },
  sold(e) { c.guard(e.app, e.auth); const q = e.request.url.query(); return e.json(200, sales.choices(e.app, q.get('account'), q.get('product'))) },
  record(e) { return e.json(200, dto(e.app, e.auth, c.read(e.app, e.auth, e.request.pathValue('id')))) },
  week(e) { c.guard(e.app, e.auth); const emp = c.employee(e.app, e.auth), start = week(e.request.url.query().get('date')); return e.json(200, dto(e.app, e.auth, findWeek(e.app, emp.id, start), start, emp.id)) },
  save(e, correction = false) {
    const b = e.requestInfo().body; c.fields(b, ['week_start', 'revision', 'lines', ...(correction ? ['reason'] : [])]); const start = week(b.week_start)
    if (start !== b.week_start || !Array.isArray(b.lines) || b.lines.length > 100 || (!Number.isInteger(b.revision) || b.revision < 0)) throw new BadRequestError('Feuille invalide (100 lignes maximum).')
    c.safe(() => c.math.checkDays(b.lines)); let id
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id); c.guard(app, u, correction ? 'validate' : 'write')
      let r = correction ? c.read(app, u, e.request.pathValue('id')) : null
      if (correction && (!c.actions(app, u, r).includes('correct') || r.getString('week_start') !== start)) throw new ForbiddenError('Seule une feuille BE soumise de votre périmètre peut être corrigée.')
      const emp = correction ? c.get(app, 'hr_employees', r.getString('employee')) : c.employee(app, u)
      if (!correction) require(`${__hooks}/lib/hr-time-policy.js`).assertBe(app, emp)
      const reason = correction ? c.text(b.reason || '') : ''
      if (correction && !reason) throw new BadRequestError('Précisez le motif de la correction.')
      if (correction && !b.lines.some((line) => line.days?.some((day) => day.minutes > 0))) throw new BadRequestError('Conservez au moins une durée positive dans la feuille soumise.')
      if (start > c.today()) throw new BadRequestError('La saisie des heures n’est pas ouverte pour une semaine future.')
      r = r || findWeek(app, emp.id, start)
      const before = auditSnapshot(app, r)
      if ((r?.getInt('revision') || 0) !== b.revision) throw new ApiError(409, 'Cette semaine a changé. Rechargez-la avant d’enregistrer.')
      if (r && !correction && !c.actions(app, u, r).includes('edit')) throw new ForbiddenError('Seul votre brouillon est modifiable.')
      if (r && !correction && r.getString('user') !== u.id) throw new ForbiddenError('La feuille appartient à un autre compte de cet employé.')
      if (!r) { r = new Record(app.findCollectionByNameOrId('time_sheets')); for (const [k, v] of Object.entries({ employee: emp.id, user: u.id, week_start: start, work_type: 'be', source_provider: 'horizon', status: 'draft' })) r.set(k, v) }
      const current = r.id ? lines(app, r.id) : [], used = new Set(), tuples = new Set()
      for (const line of b.lines) {
        accounting.normalize(app, line)
        checkLine(app, line, start)
        if (line.id && (!current.some((v) => v.id === line.id) || used.has(line.id))) throw new BadRequestError('Ligne étrangère ou dupliquée.')
        used.add(line.id)
        const key = [line.product, line.analytic_account, line.sales_order_line || '', line.context].join(':'); if (tuples.has(key)) throw new BadRequestError('Regroupez les heures d’une même activité et imputation sur une seule ligne.'); tuples.add(key)
      }
      r.set('revision', b.revision + 1); c.save(app, r)
      const previousEntries = entries(app, r.id)
      const others = c.all(app, 'time_entries', 'employee = {:employee} && sheet != {:sheet} && date >= {:start} && date <= {:end} && status != "rejected"', { employee: emp.id, sheet: r.id, start, end: c.math.addDays(start, 6) })
      const dayTotals = c.safe(() => c.math.checkDays(b.lines))
      for (let i = 0; i < 7; i++) if (dayTotals[i] + others.filter((t) => t.getString('date') === c.math.addDays(start, i)).reduce((n, t) => n + t.getInt('duration_minutes'), 0) > 1440) throw new BadRequestError('Le total journalier, toutes sources confondues, dépasse 24 h.')
      for (const old of current.filter((v) => !b.lines.some((l) => l.id === v.id))) { for (const entry of previousEntries.filter((t) => t.getString('sheet_line') === old.id)) c.remove(app, entry); c.remove(app, old) }
      for (const [index, input] of b.lines.entries()) {
        const line = input.id ? current.find((v) => v.id === input.id) : new Record(app.findCollectionByNameOrId('time_sheet_lines'))
        for (const key of ['product', 'analytic_account', 'context']) line.set(key, input[key]); line.set('sales_order_line', input.sales_order_line || ''); line.set('sheet', r.id); line.set('sort_order', index); line.set('identity_snapshot', identity(app, line)); c.save(app, line)
        for (const [i, day] of input.days.entries()) {
          const date = c.math.addDays(start, i), old = previousEntries.find((t) => t.getString('sheet_line') === line.id && t.getString('date') === date)
          if (!day.minutes && !c.text(day.description || '')) { if (old) c.remove(app, old); continue }
          const t = old || new Record(app.findCollectionByNameOrId('time_entries'))
          for (const [key, value] of Object.entries({ sheet: r.id, sheet_line: line.id, employee: emp.id, analytic_account: input.analytic_account, date, duration_minutes: day.minutes, work_type: 'be', description: c.text(day.description || ''), status: correction ? 'submitted' : 'draft', source_provider: 'horizon', cost_snapshot: {} })) t.set(key, value)
          c.save(app, t)
        }
      }
      const event = auditSheet(app, u, r, before, correction ? `Temps corrigés par le manager · ${reason}` : before ? 'Feuille de temps mise à jour' : 'Feuille de temps créée')
      if (correction) require(`${__hooks}/lib/notification-service.js`)(app, r.getString('user'), event, 'Votre feuille de temps a été corrigée', `Semaine du ${start} · ${reason}`, 'time_updates')
      id = r.id
    })
    return e.json(200, dto(e.app, e.auth, c.read(e.app, e.auth, id)))
  },
  transition(e) {
    const b = e.requestInfo().body; c.fields(b, ['revision', 'action', 'manager', 'reason']); let result
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id), r = c.read(app, u, e.request.pathValue('id'))
      if (r.getInt('revision') !== b.revision) throw new ApiError(409, 'Cette feuille a changé. Rechargez-la.')
      if (!c.actions(app, u, r).includes(b.action)) throw new ForbiddenError('Action non autorisée pour cette feuille.')
      const before = auditSnapshot(app, r), reason = c.text(b.reason || ''), times = entries(app, r.id), records = lines(app, r.id)
      if (['reject', 'reopen_validated'].includes(b.action) && !reason) throw new BadRequestError('Précisez le motif.')
      let recipient = r.getString('user')
      if (['submit', 'validate'].includes(b.action) && times.some((t) => t.getString('date') > c.today() && (t.getInt('duration_minutes') || t.getString('description')))) throw new BadRequestError('Les heures futures doivent être retirées avant la soumission ou la validation.')
      if (b.action === 'submit') {
        const owner = c.get(app, 'core_users', r.getString('user')); require(`${__hooks}/lib/hr-time-policy.js`).assertBe(app, c.employee(app, owner)); if (c.employee(app, owner).id !== r.getString('employee')) throw new BadRequestError('L’association employé de la feuille a changé.')
        if (!times.some((t) => t.getInt('duration_minutes') > 0)) throw new BadRequestError('Saisissez des heures avant de soumettre.')
        const managers = c.reviewers(app, owner), manager = managers.find((v) => v.id === b.manager)
        if (!manager) throw new BadRequestError('Choisissez un manager habilité ; un valideur global peut assurer le relais.')
        for (const line of records) checkLine(app, { ...Object.fromEntries(['id', 'product', 'analytic_account', 'sales_order_line', 'context'].map((key) => [key, line.getString(key)])), days: Array.from({ length: 7 }, (_, i) => { const t = times.find((t) => t.getString('sheet_line') === line.id && t.getString('date') === c.math.addDays(r.getString('week_start'), i)); return { minutes: t?.getInt('duration_minutes') || 0, description: t?.getString('description') || '' } }) }, r.getString('week_start'))
        r.set('manager', manager.id); r.set('submitted_at', new Date().toISOString()); recipient = manager.id
      }
      const next = { submit: 'submitted', validate: 'validated', reject: 'rejected', withdraw: 'draft', reopen: 'draft', reopen_validated: 'draft' }[b.action]
      r.set('status', next); r.set('revision', r.getInt('revision') + 1); r.set('decision_reason', reason)
      r.set('validated_by', next === 'validated' ? u.id : ''); r.set('validated_at', next === 'validated' ? new Date().toISOString() : '')
      for (const line of records) { if (next === 'validated') { accounting.check(app, line.getString('analytic_account'), line.getString('context')); line.set('identity_snapshot', identity(app, line)); c.save(app, line) } }
      for (const t of times) { t.set('status', next); t.set('validated_by', r.getString('validated_by')); t.set('validated_at', r.getString('validated_at')); if (next === 'validated') t.set('cost_snapshot', resources.cost(app, r.getString('employee'), t.getString('date'), t.getInt('duration_minutes'))); c.save(app, t) }
      c.save(app, r)
      const label = { submit: 'Feuille de temps soumise', validate: 'Feuille de temps validée', reject: 'Feuille de temps à corriger', withdraw: 'Feuille retirée de la validation', reopen: 'Feuille reprise en brouillon', reopen_validated: 'Validation des temps réouverte' }[b.action]
      const event = auditSheet(app, u, r, before, label)
      if (recipient !== u.id) require(`${__hooks}/lib/notification-service.js`)(app, recipient, event, label, `${c.name(app, r.getString('employee'))} · semaine du ${r.getString('week_start')}`, b.action === 'submit' ? 'time_requests' : 'time_updates')
      result = dto(app, u, r)
    })
    return e.json(200, result)
  },
  list(e) {
    c.guard(e.app, e.auth); const q = e.request.url.query(), month = q.get('month'), area = q.get('area') || 'own'
    if (!/^20\d{2}-\d{2}$/.test(month || '') || !c.math.valid(month + '-01') || !['own', 'review'].includes(area)) throw new BadRequestError('Mois ou vue invalide.')
    if (area === 'review' && !['reports', 'all'].includes(e.auth.getString('time_scope'))) throw new ForbiddenError('Vue équipe refusée.')
    const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10), start = week(month + '-01')
    const scope = area === 'own' ? 'user = {:user}' : e.auth.getString('time_scope') === 'all' ? 'user != {:user} && status != "draft"' : 'manager = {:user} && status != "draft"'
    const search = c.text(q.get('q') || '', 200).toLocaleLowerCase('fr'), statuses = (q.get('status') || '').split(',').filter(Boolean)
    if (statuses.some((v) => !['draft', 'submitted', 'validated', 'rejected', 'missing'].includes(v))) throw new BadRequestError('État invalide.')
    let rows = c.all(e.app, 'time_sheets', `(${scope}) && week_start >= {:start} && week_start <= {:end}`, { user: e.auth.id, start, end }, '-week_start,id').map((r) => { const times = entries(e.app, r.id), visibleTimes = times.filter((t) => t.getString('date').slice(0, 7) === month); return { id: r.id, employee: r.getString('employee'), employee_name: c.name(e.app, r.getString('employee')), week_start: r.getString('week_start'), status: r.getString('status'), total_minutes: times.reduce((n, t) => n + t.getInt('duration_minutes'), 0), month_minutes: visibleTimes.reduce((n, t) => n + t.getInt('duration_minutes'), 0), manager_name: r.getString('manager') ? c.get(e.app, 'core_users', r.getString('manager')).getString('name') : '' } })
    // Only explicit BE capacities create an expectation. Draft contents remain private.
    const employee = area === 'own' ? e.auth.getString('employee') : ''
    const expectedEmployees = area === 'review' ? resources.beEmployees(e.app, e.auth) : employee ? [c.get(e.app, 'hr_employees', employee)] : []
    const today = c.today()
    for (const emp of expectedEmployees) for (let day = start; day <= end && day <= today; day = c.math.addDays(day, 7)) {
      if (!resources.beExpected(e.app, emp.id, day) || rows.some((r) => r.employee === emp.id && r.week_start === day)) continue
      const existing = findWeek(e.app, emp.id, day)
      if (existing && (area === 'own' || existing.getString('status') !== 'draft')) continue
      const availability = calendar(e.app, emp.id, day)
      if (!availability.some((d) => d.date.slice(0, 7) === month && d.date <= today && d.capacity_minutes > 0)) continue
      rows.push({ id: '', employee: emp.id, employee_name: c.name(e.app, emp.id), week_start: day, status: 'missing', total_minutes: 0, month_minutes: 0, manager_name: '' })
    }
    // Overview covers the entire month and scope, independently of list filters/pagination.
    const summary = { minutes: 0, missing: 0, draft: 0, submitted: 0, validated: 0, rejected: 0 }
    for (const row of rows) { summary.minutes += row.month_minutes; summary[row.status] += 1 }
    const missing = summary.missing
    rows = rows.filter((r) => (!statuses.length || statuses.includes(r.status)) && (!search || `${r.employee_name} ${r.week_start} ${r.manager_name}`.toLocaleLowerCase('fr').includes(search)))
    require(`${__hooks}/lib/list-sorting.js`).rows(rows, q.get('sort') || '-week_start', ['employee_name', 'week_start', 'status', 'total_minutes', 'month_minutes', 'manager_name'], 'week_start')
    const totalItems = rows.length, totalMinutes = rows.reduce((n, r) => n + r.month_minutes, 0), totalPages = Math.max(1, Math.ceil(totalItems / 30)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.get('page'))) || 1))
    return e.json(200, { items: rows.slice((page - 1) * 30, page * 30), totalItems, totalPages, page, total_minutes: totalMinutes, missing, summary })
  },
  favorite(e) {
    const b = e.requestInfo().body; c.fields(b, ['id', 'product', 'analytic_account', 'sales_order_line', 'context'])
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id); c.guard(app, u, 'write')
      if (b.id) { const r = c.get(app, 'time_favorites', b.id); if (r.getString('user') !== u.id) throw new ForbiddenError('Favori privé.'); c.remove(app, r); return }
      require(`${__hooks}/lib/hr-time-policy.js`).assertBe(app, c.employee(app, u))
      if (c.all(app, 'time_favorites', 'user = {:user}', { user: u.id }).length >= 50) throw new BadRequestError('50 favoris maximum.')
      accounting.normalize(app, b)
      checkLine(app, { ...b, days: Array.from({ length: 7 }, () => ({ minutes: 0, description: '' })) }, week(new Date().toISOString().slice(0, 10)))
      const r = new Record(app.findCollectionByNameOrId('time_favorites')); for (const key of ['product', 'analytic_account', 'context']) r.set(key, b[key]); r.set('sales_order_line', b.sales_order_line || ''); r.set('user', u.id); c.save(app, r)
    })
    return e.json(200, options(e.app, e.auth))
  },
}
