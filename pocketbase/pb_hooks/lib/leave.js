const access = require(`${__hooks}/lib/access-policy.js`)
const dates = require(`${__hooks}/lib/leave-dates.js`)
const states = { draft: 'Brouillon', submitted: 'À valider', approved: 'Validé', rejected: 'Refusé', cancel_requested: 'Annulation demandée', cancelled: 'Annulé' }
const get = (app, table, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Référence invalide.'); try { return app.findRecordById(table, id) } catch { throw new ApiError(404, 'Fiche introuvable.') } }
const all = (app, table, filter = '', params = {}, sort = 'created,id') => { const rows = app.findRecordsByFilter(table, filter, sort, 10001, 0, params); if (rows.length > 10000) throw new BadRequestError('Réduisez la période de recherche.'); return rows }
const json = (r, field, fallback = {}) => JSON.parse(r.getString(field) || JSON.stringify(fallback))
const text = (v, max = 3000) => { if (typeof v !== 'string' || v.length > max) throw new BadRequestError('Texte invalide.'); return v.trim() }
const fields = (b, allowed) => { if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).some((k) => !allowed.includes(k))) throw new BadRequestError('Champs invalides.') }
const rights = (app, u) => access.permissions(app, u)
const can = (app, u, action) => rights(app, u).includes('leave.read') && (action === 'read' || u.getString('erp_profile') !== 'viewer') && rights(app, u).includes(`leave.${action}`) && (action === 'read' || !['allocate', 'settings'].includes(action) || u.getString('leave_scope') === 'all')
const guard = (app, u, action = 'read') => { if (!can(app, u, action) || !['self', 'reports', 'all'].includes(u.getString('leave_scope'))) throw new ForbiddenError('Accès aux congés refusé.') }
const visible = (u, r) => u.id === r.getString('user') || u.getString('leave_scope') === 'all' || u.getString('leave_scope') === 'reports' && r.getString('manager') === u.id && r.getString('submitted_at') && r.getString('status') !== 'draft'
const read = (app, u, id) => { guard(app, u); const r = get(app, 'leave_requests', id); if (!visible(u, r)) throw new ForbiddenError('Demande hors de votre périmètre.'); return r }
const version = (r, value) => { if (r.getString('updated') !== value) throw new ApiError(409, 'Cette fiche a changé. Rechargez-la.') }
const employeeName = (app, id) => { const r = get(app, 'hr_employees', id); return `${r.getString('first_name')} ${r.getString('last_name')}`.trim() }
const policy = (app) => { const r = all(app, 'leave_settings')[0]; return { ...r.publicExport(), weekdays: json(r, 'weekdays', []), holidays: json(r, 'holidays', []), working_holidays: json(r, 'working_holidays', []) } }
const calculate = (b, p) => { try { return dates.calculate(b, p) } catch (err) { throw new BadRequestError(err.message) } }
const principal = (app, u) => {
  if (!u.getString('employee')) return ''
  const boss = get(app, 'hr_employees', u.getString('employee')).getString('manager')
  return boss ? all(app, 'core_users', 'employee = {:id} && active = true', { id: boss }).find((m) => m.id !== u.id && can(app, m, 'validate') && ['reports', 'all'].includes(m.getString('leave_scope')))?.id || '' : ''
}
// Direction is an HR-managed responsibility, never a client-supplied declaration flag.
const directDeclaration = (app, u) => {
  if (!u.getString('employee') || !can(app, u, 'submit')) return false
  const emp = get(app, 'hr_employees', u.getString('employee'))
  return emp.getString('status') === 'active' && emp.getBool('is_direction') && !emp.getString('manager')
}
const declared = (r) => json(r, 'policy_snapshot').approval_mode === 'direct_declaration'
const hrRecipients = (app) => all(app, 'core_users', 'active = true').filter((u) => can(app, u, 'allocate') && u.getString('leave_scope') === 'all')
const reviewers = (app, u) => { const boss = principal(app, u); return all(app, 'core_users', 'active = true && id != {:id}', { id: u.id }, 'name,id').filter((m) => can(app, m, 'validate') && (m.id === boss || m.getString('leave_scope') === 'all')) }
const manager = (app, u, id) => { const boss = principal(app, u), chosen = id || boss; const r = reviewers(app, u).find((v) => v.id === chosen); if (!r || boss && chosen !== boss) throw new BadRequestError('Choisissez un manager habilité. Le responsable principal est utilisé lorsqu’il est disponible.'); return r }
const balances = (app, employee, year) => all(app, 'leave_types', 'tracked = true', {}, 'sort_order,id').map((t) => {
  const allocated = all(app, 'leave_allocations', 'employee = {:employee} && type = {:type} && year = {:year}', { employee, type: t.id, year }).reduce((n, a) => n + a.getFloat('days'), 0)
  let used = 0, pending = 0
  for (const r of all(app, 'leave_requests', 'employee = {:employee} && type = {:type} && (status = "submitted" || status = "approved" || status = "cancel_requested")', { employee, type: t.id })) {
    const amount = json(r, 'breakdown')[String(year)] || 0
    if (r.getString('status') === 'submitted') pending += amount; else used += amount
  }
  return { type: t.id, label: t.getString('label'), year, allocated, used, pending, remaining: allocated - used, available: allocated - used - pending }
})
const provision = (app, r) => {
  const t = get(app, 'leave_types', r.getString('type')); if (!t.getBool('tracked')) return
  for (const [year, amount] of Object.entries(json(r, 'breakdown'))) {
    const b = balances(app, r.getString('employee'), Number(year)).find((b) => b.type === t.id)
    const ownReservation = r.getString('status') === 'submitted' ? Number(amount) : 0
    if (b.available + ownReservation < Number(amount)) throw new BadRequestError(`Solde ${t.getString('label')} insuffisant en ${year} : ${b.available + ownReservation} j disponibles pour ${amount} j demandés.`)
  }
}
const overlap = (app, r) => {
  // Date intervals deliberately use both half-days, even on excluded weekdays.
  const start = `${r.getString('start_date')}:${r.getString('start_half')}`, end = `${r.getString('end_date')}:${r.getString('end_half')}`
  for (const other of all(app, 'leave_requests', 'employee = {:employee} && id != {:id} && (status = "submitted" || status = "approved" || status = "cancel_requested") && start_date <= {:end} && end_date >= {:start}', { employee: r.getString('employee'), id: r.id, start: r.getString('start_date'), end: r.getString('end_date') })) {
    if (`${other.getString('start_date')}:${other.getString('start_half')}` <= end && `${other.getString('end_date')}:${other.getString('end_half')}` >= start) throw new BadRequestError('Une autre demande couvre déjà cette période ou cette demi-journée.')
  }
}
const actions = (app, u, r) => {
  const s = r.getString('status'), owner = r.getString('user') === u.id, result = []
  if (r.getString('archived_at')) return (owner && can(app, u, 'write') || can(app, u, 'allocate')) ? ['restore'] : []
  if (owner && can(app, u, 'write')) {
    if (s === 'draft') result.push('edit', 'cancel')
    if (s === 'submitted') result.push('withdraw')
    if (s === 'rejected') result.push('reopen', 'archive')
    if (s === 'approved') result.push(declared(r) ? 'cancel_declaration' : 'request_cancel')
    if (s === 'cancelled') result.push('archive')
  }
  if (owner && s === 'draft' && can(app, u, 'submit')) result.push(directDeclaration(app, u) ? 'declare' : 'submit')
  if (!owner && r.getString('manager') === u.id && can(app, u, 'validate') && ['reports', 'all'].includes(u.getString('leave_scope'))) {
    if (s === 'submitted') result.push('approve', 'reject')
    if (s === 'cancel_requested') result.push('approve_cancel', 'deny_cancel')
  }
  if (can(app, u, 'allocate') && ['cancelled', 'rejected'].includes(s) && !result.includes('archive')) result.push('archive')
  if (can(app, u, 'allocate') && ['submitted', 'cancel_requested'].includes(s)) result.push('reassign')
  return result
}
const dto = (app, u, r, details = true) => ({ ...r.publicExport(), direct_declaration: declared(r) || r.getString('status') === 'draft' && directDeclaration(app, get(app, 'core_users', r.getString('user'))), employee_name: json(r, 'policy_snapshot').employee_name || employeeName(app, r.getString('employee')), type_label: json(r, 'policy_snapshot').type_label || get(app, 'leave_types', r.getString('type')).getString('label'), manager_name: r.getString('manager') ? get(app, 'core_users', r.getString('manager')).getString('name') : '', actions: actions(app, u, r), managers: details && can(app, u, 'allocate') ? reviewers(app, get(app, 'core_users', r.getString('user'))).map((m) => ({ id: m.id, label: m.getString('name') })) : [] })
const publish = (app, u, r, before, body, recipient = '', informHr = false) => {
  access.audit(app, 'leave_requests', r.id, u.id, before, r.publicExport(), before ? 'update' : 'create')
  const e = require(`${__hooks}/lib/activity.js`).publish(app, r, u.id, before ? 'status_change' : 'change', body, {})
  for (const target of informHr ? hrRecipients(app).map((v) => v.id) : recipient && recipient !== u.id ? [recipient] : []) require(`${__hooks}/lib/notification-service.js`)(app, target, e, body, `${employeeName(app, r.getString('employee'))} · ${r.getString('start_date')} — ${r.getString('end_date')}`, ['submitted', 'cancel_requested'].includes(r.getString('status')) ? 'leave_requests' : 'leave_updates')
}
const allocationDTO = (app, r) => ({ id: r.id, employee: r.getString('employee'), employee_name: employeeName(app, r.getString('employee')), type: r.getString('type'), type_label: get(app, 'leave_types', r.getString('type')).getString('label'), year: r.getInt('year'), days: r.getFloat('days'), reason: r.getString('reason'), author_name: get(app, 'core_users', r.getString('author')).getString('name'), created: r.getString('created') })
module.exports = {
  timeCalendar(app, employee, start, end) {
    const p = policy(app), named = {}, excluded = new Set(p.holidays)
    if (p.holiday_calendar === 'metropole') for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) for (const [date, label] of Object.entries(require(`${__hooks}/lib/leave-holidays.js`).named(year))) if (!(p.working_holidays || []).includes(date)) { excluded.add(date); named[date] = label }
    const requests = all(app, 'leave_requests', 'employee = {:employee} && (status = "approved" || status = "cancel_requested") && start_date <= {:end} && end_date >= {:start}', { employee, start, end })
    const days = []
    for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
      const date = new Date(t).toISOString().slice(0, 10)
      let absent = 0
      for (const r of requests) if (date >= r.getString('start_date') && date <= r.getString('end_date')) {
        if (date !== r.getString('start_date') || r.getString('start_half') === 'am') absent += 0.5
        if (date !== r.getString('end_date') || r.getString('end_half') === 'pm') absent += 0.5
      }
      days.push({ date, holiday: excluded.has(date) ? named[date] || 'Jour non travaillé' : '', weekend: [0, 6].includes(new Date(t).getUTCDay()), absent: Math.min(1, absent) })
    }
    return days
  },
  activitySource(app, u, id, write = false) { const r = read(app, u, id); if (write && (r.getString('archived_at') || !(r.getString('user') === u.id && can(app, u, 'write') || r.getString('manager') === u.id && can(app, u, 'validate') || can(app, u, 'allocate')))) throw new ForbiddenError('Contribution au fil refusée.'); return r },
  choices(e) {
    guard(e.app, e.auth); const app = e.app, u = e.auth, employee = u.getString('employee'), active = employee && get(app, 'hr_employees', employee).getString('status') === 'active'
    return e.json(200, { employee: active ? employee : '', employee_name: employee ? employeeName(app, employee) : '', direct_declaration: directDeclaration(app, u), default_manager: principal(app, u), managers: reviewers(app, u).map((m) => ({ id: m.id, label: m.getString('name') })), types: all(app, 'leave_types', '', {}, 'sort_order,id').map((r) => r.publicExport()), policy: policy(app), can_review: can(app, u, 'validate') && ['reports', 'all'].includes(u.getString('leave_scope')), can_allocate: can(app, u, 'allocate'), can_settings: can(app, u, 'settings') })
  },
  balances(e) {
    guard(e.app, e.auth); const year = Number(e.request.url.query().get('year'))
    if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new BadRequestError('Année invalide.')
    return e.json(200, e.auth.getString('employee') ? balances(e.app, e.auth.getString('employee'), year) : [])
  },
  preview(e) { guard(e.app, e.auth); fields(e.requestInfo().body, ['start_date', 'end_date', 'start_half', 'end_half']); return e.json(200, calculate(e.requestInfo().body, policy(e.app))) },
  list(e) {
    guard(e.app, e.auth); const q = e.request.url.query(), u = e.auth, area = q.get('area') || 'own', year = Number(q.get('year') || new Date().getUTCFullYear())
    if (!Number.isInteger(year) || year < 2000 || year > 2200 || !['own', 'review'].includes(area)) throw new BadRequestError('Période ou vue invalide.')
    if (area === 'review' && !['reports', 'all'].includes(u.getString('leave_scope'))) throw new ForbiddenError('Vue manager refusée.')
    const scope = area === 'own' ? 'user = {:user}' : u.getString('leave_scope') === 'all' ? 'user != {:user} && submitted_at != "" && status != "draft"' : 'manager = {:user} && submitted_at != "" && status != "draft"'
    const chosen = (q.get('status') || '').split(',').filter(Boolean), types = (q.get('type') || '').split(',').filter(Boolean)
    if (chosen.some((s) => !states[s])) throw new BadRequestError('État invalide.')
    let rows = all(e.app, 'leave_requests', `(${scope}) && start_date <= {:end} && end_date >= {:start}`, { user: u.id, start: `${year}-01-01`, end: `${year}-12-31` }, '-start_date,-id').filter((r) => Boolean(r.getString('archived_at')) === (q.get('state') === 'archived')).map((r) => dto(e.app, u, r, false))
    const summary = Object.fromEntries(Object.keys(states).map((s) => [s, rows.filter((r) => r.status === s).length]))
    const search = (q.get('q') || '').trim().toLocaleLowerCase('fr')
    rows = rows.filter((r) => (!chosen.length || chosen.includes(r.status)) && (!types.length || types.includes(get(e.app, 'leave_types', r.type).getString('code'))) && (!search || `${r.employee_name} ${r.type_label} ${r.reason} ${r.start_date} ${r.manager_name}`.toLocaleLowerCase('fr').includes(search)))
    require(`${__hooks}/lib/list-sorting.js`).rows(rows, q.get('sort') || '-start_date', ['employee', 'type', 'start_date', 'end_date', 'duration', 'manager', 'status'], 'start_date', (r, f) => ({ employee: r.employee_name, type: r.type_label, manager: r.manager_name, status: states[r.status] })[f] ?? r[f])
    const totalItems = rows.length, totalPages = Math.max(1, Math.ceil(totalItems / 30)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.get('page'))) || 1))
    return e.json(200, { items: rows.slice((page - 1) * 30, page * 30), page, totalItems, totalPages, summary, balances: u.getString('employee') ? balances(e.app, u.getString('employee'), year) : [] })
  },
  record(e) { return e.json(200, dto(e.app, e.auth, read(e.app, e.auth, e.request.pathValue('id')))) },
  save(e) {
    guard(e.app, e.auth, 'write'); const b = e.requestInfo().body; fields(b, ['id', 'updated', 'creation_key', 'input', 'removed'])
    let input = b.input; if (typeof input === 'string') { try { input = JSON.parse(input) } catch { throw new BadRequestError('Demande invalide.') } }
    fields(input, ['type', 'start_date', 'end_date', 'start_half', 'end_half', 'reason', 'manager'])
    let saved
    e.app.runInTransaction((app) => {
      const u = get(app, 'core_users', e.auth.id); guard(app, u, 'write')
      const emp = get(app, 'hr_employees', u.getString('employee')); if (emp.getString('status') !== 'active') throw new BadRequestError('Associez votre compte à un employé actif.')
      const key = text(b.creation_key || '', 100), hash = $security.sha256(JSON.stringify(['type', 'start_date', 'end_date', 'start_half', 'end_half', 'reason', 'manager'].map((k) => input[k] ?? '')))
      if (!b.id && key.length < 10) throw new BadRequestError('Clé de création requise.')
      const existing = !b.id && all(app, 'leave_requests', 'creation_key = {:key}', { key })[0]
      if (existing) { if (existing.getString('user') !== u.id || existing.getString('creation_hash') !== hash) throw new ApiError(409, 'Clé déjà utilisée.'); saved = existing; return }
      const r = b.id ? read(app, u, b.id) : new Record(app.findCollectionByNameOrId('leave_requests')), before = b.id ? r.publicExport() : null
      if (b.id) { version(r, b.updated); if (!actions(app, u, r).includes('edit')) throw new ForbiddenError('Seul votre brouillon est modifiable.') }
      const t = get(app, 'leave_types', input.type), p = policy(app), computed = calculate(input, p)
      if (!b.id) for (const [k, v] of Object.entries({ employee: emp.id, user: u.id, status: 'draft', creation_key: key, creation_hash: hash })) r.set(k, v)
      for (const k of ['start_date', 'end_date', 'start_half', 'end_half']) r.set(k, input[k])
      r.set('type', t.id); r.set('reason', text(input.reason || '')); r.set('manager', directDeclaration(app, u) ? '' : input.manager ? manager(app, u, input.manager).id : principal(app, u)); r.set('duration', computed.duration); r.set('breakdown', computed.breakdown); r.set('policy_snapshot', {})
      let removed = b.removed || []; if (typeof removed === 'string') { try { removed = JSON.parse(removed) } catch { throw new BadRequestError('Fichiers invalides.') } }
      const current = r.getStringSlice('attachments'); if (!Array.isArray(removed) || removed.some((name) => !current.includes(name))) throw new BadRequestError('Fichiers invalides.')
      let uploads = []; if (e.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { uploads = e.findUploadedFiles('attachments') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } }
      if (current.length - removed.length + uploads.length > 10) throw new BadRequestError('10 justificatifs maximum.'); r.set('attachments', [...current.filter((name) => !removed.includes(name)), ...uploads])
      app.save(r); publish(app, u, r, before, before ? 'Demande mise à jour' : 'Demande créée'); saved = r
    })
    return e.json(200, dto(e.app, e.auth, saved))
  },
  transition(e) {
    const b = e.requestInfo().body; fields(b, ['updated', 'action', 'reason', 'manager']); let saved
    e.app.runInTransaction((app) => {
      const u = get(app, 'core_users', e.auth.id), r = read(app, u, e.request.pathValue('id')); version(r, b.updated)
      if (!actions(app, u, r).includes(b.action)) throw new ForbiddenError('Action non autorisée pour cette demande.')
      const before = r.publicExport(), reason = text(b.reason || '', 2000), owner = r.getString('user'), labels = { declare: 'Congé déclaré par la direction — RH informés', cancel_declaration: 'Déclaration de congé annulée — RH informés', submit: 'Demande soumise au manager', approve: 'Congé validé', reject: 'Demande refusée', withdraw: 'Demande retirée de la validation', reopen: 'Demande reprise en brouillon', cancel: 'Brouillon annulé', request_cancel: 'Annulation demandée', approve_cancel: 'Annulation acceptée', deny_cancel: 'Annulation refusée', reassign: 'Manager réaffecté', archive: 'Demande archivée', restore: 'Demande réactivée' }
      let recipient = owner
      if (['reject', 'request_cancel', 'cancel_declaration', 'deny_cancel', 'reassign'].includes(b.action) && !reason) throw new BadRequestError('Un motif est nécessaire.')
      if (['declare', 'cancel_declaration'].includes(b.action) && !hrRecipients(app).length) throw new BadRequestError('Aucun compte RH habilité à recevoir la déclaration. Configurez un gestionnaire des congés avec accès global.')
      if (['submit', 'declare'].includes(b.action)) {
        const source = get(app, 'core_users', owner), emp = get(app, 'hr_employees', r.getString('employee')); if (emp.getString('status') !== 'active' || source.getString('employee') !== emp.id) throw new BadRequestError('L’association employé doit être active.')
        const direct = b.action === 'declare'
        const m = direct ? null : manager(app, source, principal(app, source) || r.getString('manager')), t = get(app, 'leave_types', r.getString('type')), p = policy(app), computed = calculate(r.publicExport(), p)
        if (t.getBool('receipt_required') && !r.getStringSlice('attachments').length) throw new BadRequestError('Ajoutez un justificatif avant de soumettre.')
        r.set('duration', computed.duration); r.set('breakdown', computed.breakdown); r.set('policy_snapshot', { weekdays: p.weekdays, holidays: p.holidays, holiday_calendar: p.holiday_calendar, working_holidays: p.working_holidays, approval_mode: direct ? 'direct_declaration' : 'manager', employee_name: employeeName(app, emp.id), type_label: t.getString('label') }); overlap(app, r); provision(app, r)
        r.set('manager', m ? m.id : ''); r.set('status', direct ? 'approved' : 'submitted'); r.set('submitted_at', new Date().toISOString()); r.set('decision_reason', ''); recipient = m ? m.id : ''
        if (direct) { r.set('validated_at', new Date().toISOString()); r.set('validated_by', u.id) }
      } else if (b.action === 'approve') { overlap(app, r); provision(app, r); r.set('status', 'approved'); r.set('validated_at', new Date().toISOString()); r.set('validated_by', u.id) }
      else if (b.action === 'reject') r.set('status', 'rejected')
      else if (['withdraw', 'reopen'].includes(b.action)) { r.set('status', 'draft'); r.set('submitted_at', ''); r.set('policy_snapshot', {}); recipient = r.getString('manager') }
      else if (['cancel', 'approve_cancel', 'cancel_declaration'].includes(b.action)) r.set('status', 'cancelled')
      else if (b.action === 'request_cancel') { r.set('status', 'cancel_requested'); recipient = r.getString('manager') }
      else if (b.action === 'deny_cancel') r.set('status', 'approved')
      else if (b.action === 'reassign') {
        const m = get(app, 'core_users', b.manager), source = get(app, 'core_users', owner)
        if (!reviewers(app, source).some((v) => v.id === m.id)) throw new BadRequestError('Manager non habilité pour cet employé.')
        r.set('manager', m.id); recipient = m.id
      } else if (['archive', 'restore'].includes(b.action)) r.set('archived_at', b.action === 'archive' ? new Date().toISOString() : '')
      if (reason) r.set('decision_reason', reason)
      app.save(r); publish(app, u, r, before, `${labels[b.action]}${reason ? ` : ${reason}` : ''}`, recipient, ['declare', 'cancel_declaration'].includes(b.action)); saved = r
    })
    return e.json(200, dto(e.app, e.auth, saved))
  },
  allocations(e) {
    guard(e.app, e.auth, 'allocate'); const q = e.request.url.query(), year = Number(q.get('year') || new Date().getUTCFullYear()), employee = q.get('employee') || ''
    if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new BadRequestError('Année invalide.')
    const employees = all(e.app, 'hr_employees', '', {}, 'last_name,first_name,id').map((r) => ({ id: r.id, label: employeeName(e.app, r.id), active: r.getString('status') === 'active' }))
    if (employee && !employees.some((v) => v.id === employee)) throw new BadRequestError('Employé invalide.')
    const query = (q.get('q') || '').trim().toLocaleLowerCase('fr')
    let items = all(e.app, 'leave_allocations', 'year = {:year}' + (employee ? ' && employee = {:employee}' : ''), { year, employee }, '-created,-id').map((r) => allocationDTO(e.app, r)).filter((r) => !query || `${r.employee_name} ${r.type_label} ${r.reason} ${r.author_name}`.toLocaleLowerCase('fr').includes(query))
    require(`${__hooks}/lib/list-sorting.js`).rows(items, q.get('sort') || '-created', ['created', 'employee', 'type', 'year', 'days', 'reason', 'author'], 'created', (r, f) => ({ employee: r.employee_name, type: r.type_label, author: r.author_name })[f] ?? r[f])
    const totalItems = items.length, totalPages = Math.max(1, Math.ceil(totalItems / 30)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.get('page'))) || 1))
    items = items.slice((page - 1) * 30, page * 30)
    return e.json(200, { employees, items, page, totalItems, totalPages, balances: employee ? balances(e.app, employee, year) : [] })
  },
  allocate(e) {
    const b = e.requestInfo().body; fields(b, ['employee', 'type', 'year', 'days', 'reason', 'creation_key']); let saved
    e.app.runInTransaction((app) => {
      const u = get(app, 'core_users', e.auth.id); guard(app, u, 'allocate')
      const key = text(b.creation_key || '', 100), hash = $security.sha256(JSON.stringify(['employee', 'type', 'year', 'days', 'reason'].map((k) => b[k]))); if (key.length < 10) throw new BadRequestError('Clé de création requise.')
      const existing = all(app, 'leave_allocations', 'creation_key = {:key}', { key })[0]
      if (existing) { if (existing.getString('author') !== u.id || existing.getString('creation_hash') !== hash) throw new ApiError(409, 'Clé déjà utilisée.'); saved = existing; return }
      const emp = get(app, 'hr_employees', b.employee), t = get(app, 'leave_types', b.type), reason = text(b.reason || '', 2000)
      if (!t.getBool('tracked') || emp.getString('status') !== 'active' || !Number.isInteger(b.year) || b.year < 2000 || b.year > 2200 || typeof b.days !== 'number' || !Number.isFinite(b.days) || !b.days || Math.abs(b.days) > 1000 || !Number.isInteger(b.days * 2) || !reason) throw new BadRequestError('Allocation invalide : employé actif, type à compteur, jours par pas de 0,5 et motif requis.')
      const balance = balances(app, emp.id, b.year).find((v) => v.type === t.id)
      if (balance.available + b.days < 0) throw new BadRequestError('La correction rendrait le solde disponible négatif. Traitez les demandes concernées avant de corriger.')
      const r = new Record(app.findCollectionByNameOrId('leave_allocations')); for (const [k, v] of Object.entries({ employee: emp.id, type: t.id, year: b.year, days: b.days, reason, author: u.id, creation_key: key, creation_hash: hash })) r.set(k, v)
      app.save(r); access.audit(app, 'leave_allocations', r.id, u.id, null, r.publicExport(), 'create'); saved = r
    })
    return e.json(200, allocationDTO(e.app, saved))
  },
  settings(e) {
    const b = e.requestInfo().body; fields(b, ['updated', 'weekdays', 'holidays', 'holiday_calendar', 'working_holidays', 'types'])
    e.app.runInTransaction((app) => {
      const u = get(app, 'core_users', e.auth.id); guard(app, u, 'settings'); const p = all(app, 'leave_settings')[0]; version(p, b.updated)
      if (!Array.isArray(b.weekdays) || !b.weekdays.length || b.weekdays.length > 7 || new Set(b.weekdays).size !== b.weekdays.length || b.weekdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7) || !Array.isArray(b.holidays) || b.holidays.length > 1000 || new Set(b.holidays).size !== b.holidays.length || b.holidays.some((d) => !dates.valid(d))) throw new BadRequestError('Calendrier de décompte invalide.')
      const calendar = b.holiday_calendar ?? p.getString('holiday_calendar'), worked = b.working_holidays ?? json(p, 'working_holidays', [])
      if (!['metropole', 'none'].includes(calendar) || !Array.isArray(worked) || worked.length > 1000 || new Set(worked).size !== worked.length || worked.some((d) => !dates.valid(d))) throw new BadRequestError('Jours fériés travaillés ou calendrier invalides.')
      if (worked.some((d) => b.holidays.includes(d))) throw new BadRequestError('Une date ne peut pas être à la fois exclue et travaillée.')
      const types = all(app, 'leave_types'); if (!Array.isArray(b.types) || b.types.length !== types.length || new Set(b.types.map((v) => v.id)).size !== types.length) throw new BadRequestError('Types invalides.')
      for (const t of b.types) { fields(t, ['id', 'receipt_required']); const r = types.find((v) => v.id === t.id); if (!r || typeof t.receipt_required !== 'boolean') throw new BadRequestError('Type invalide.'); const before = r.publicExport(); r.set('receipt_required', t.receipt_required); app.save(r); access.audit(app, 'leave_types', r.id, u.id, before, r.publicExport(), 'update') }
      const before = p.publicExport(); p.set('weekdays', [...b.weekdays].sort()); p.set('holidays', [...b.holidays].sort()); p.set('holiday_calendar', calendar); p.set('working_holidays', [...worked].sort()); app.save(p); access.audit(app, 'leave_settings', p.id, u.id, before, p.publicExport(), 'update')
    }); return module.exports.choices(e)
  },
  calendarProjection(e, from, to) {
    const app = e.app, u = e.auth, q = e.request.url.query()
    if (!can(app, u, 'read') || !['self', 'reports', 'all'].includes(u.getString('leave_scope')) || q.get('scope') === 'tenders' || q.get('owner') && q.get('owner') !== u.id || ['company', 'preparation_status', 'tag'].some((key) => q.get(key))) return []
    const status = q.get('status') || ''
    if (status && !['submitted', 'approved', 'cancel_requested'].includes(status)) return []
    const first = from.slice(0, 10), last = new Date(Date.parse(to) - 1).toISOString().slice(0, 10)
    const requests = all(app, 'leave_requests', 'user = {:user} && (status = "submitted" || status = "approved" || status = "cancel_requested") && start_date <= {:last} && end_date >= {:first}' + (q.get('state') === 'archived' ? ' && archived_at != ""' : ' && archived_at = ""') + (status ? ' && status = {:status}' : ''), { user: u.id, first, last, status }, 'start_date,id')
    const search = (q.get('q') || '').trim().toLocaleLowerCase('fr'), items = []
    for (const r of requests) {
      const start = r.getString('start_date'), end = r.getString('end_date'), state = r.getString('status')
      const begin = start > first ? start : first, finish = end < last ? end : last
      for (let stamp = Date.parse(begin); stamp <= Date.parse(finish); stamp += 86400000) {
        const day = new Date(stamp).toISOString().slice(0, 10)
        const half = day === start && r.getString('start_half') === 'pm' ? 'Après-midi' : day === end && r.getString('end_half') === 'am' ? 'Matin' : ''
        const title = `${state === 'submitted' ? 'Congé à valider' : state === 'cancel_requested' ? 'Congé · Annulation demandée' : 'Congé validé'}${half ? ` · ${half}` : ''}`
        if (search && !title.toLocaleLowerCase('fr').includes(search)) continue
        items.push({ id: `leave:${r.id}:${day}`, source_module: 'leave', source_entity: 'leave_requests', source_record_id: r.id, kind: 'leave', title, code: '', company: '', start: `${day}T00:00:00.000Z`, end: '', all_day: true, timezone: 'Europe/Paris', location: '', tone: state === 'submitted' || state === 'cancel_requested' ? 'amber' : 'blue', href: `/leave/${r.id}` })
      }
    }
    return items
  },
  calendar(e) {
    guard(e.app, e.auth); const q = e.request.url.query(), from = q.get('from'), to = q.get('to'), u = e.auth
    if (!dates.valid(from) || !dates.valid(to) || to < from || Date.parse(to) - Date.parse(from) > 94 * 86400000) throw new BadRequestError('Période invalide (trois mois maximum).')
    const own = u.getString('employee') ? get(e.app, 'hr_employees', u.getString('employee')) : null
    const employees = all(e.app, 'hr_employees').filter((r) => u.getString('leave_scope') === 'all' || own && (r.id === own.id || r.getString('manager') === own.id || own.getString('manager') === r.id || own.getString('team') && own.getString('team') === r.getString('team'))).map((r) => r.id)
    const search = (q.get('q') || '').trim().toLocaleLowerCase('fr')
    const items = all(e.app, 'leave_requests', '(status = "submitted" || status = "approved" || status = "cancel_requested") && start_date <= {:to} && end_date >= {:from}', { from, to }, 'start_date,id').filter((r) => employees.includes(r.getString('employee'))).map((r) => ({ id: visible(u, r) ? r.id : '', employee_name: employeeName(e.app, r.getString('employee')), start_date: r.getString('start_date'), end_date: r.getString('end_date'), start_half: r.getString('start_half'), end_half: r.getString('end_half'), pending: r.getString('status') === 'submitted', href: visible(u, r) ? `/leave/${r.id}` : '' })).filter((r) => !search || r.employee_name.toLocaleLowerCase('fr').includes(search))
    return e.json(200, { items })
  },
}
