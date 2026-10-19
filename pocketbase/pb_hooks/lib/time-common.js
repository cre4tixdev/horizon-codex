const policy = require(`${__hooks}/lib/access-policy.js`)
const math = require(`${__hooks}/lib/time-math.js`)
const get = (app, table, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Référence invalide.'); try { return app.findRecordById(table, id) } catch { throw new ApiError(404, 'Fiche introuvable.') } }
const all = (app, table, filter = '', params = {}, sort = 'id', limit = 10001) => { const rows = app.findRecordsByFilter(table, filter, sort, limit, 0, params); if (rows.length >= 10001) throw new BadRequestError('Trop de résultats, réduisez la période.'); return rows }
const fields = (b, allowed) => { if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).some((k) => !allowed.includes(k))) throw new BadRequestError('Champs TimeReport invalides.') }
const text = (v, max = 2000) => { if (typeof v !== 'string' || v.length > max) throw new BadRequestError('Texte invalide.'); return v.trim() }
const json = (r, key, fallback = {}) => JSON.parse(r.getString(key) || JSON.stringify(fallback))
const can = (app, u, action) => policy.permissions(app, u).includes('time.read') && policy.permissions(app, u).includes(`time.${action}`) && ['self', 'reports', 'all'].includes(u.getString('time_scope')) && (action === 'read' || u.getString('erp_profile') !== 'viewer') && (!['settings', 'costs'].includes(action) || u.getString('time_scope') === 'all')
const guard = (app, u, action = 'read') => { if (!can(app, u, action)) throw new ForbiddenError('Accès TimeReport refusé.') }
const visible = (app, u, r) => can(app, u, 'read') && (r.getString('user') === u.id || u.getString('time_scope') === 'all' || u.getString('time_scope') === 'reports' && r.getString('manager') === u.id && r.getString('status') !== 'draft')
const read = (app, u, id) => { guard(app, u); const r = get(app, 'time_sheets', id); if (!visible(app, u, r)) throw new ForbiddenError('Feuille hors de votre périmètre.'); return r }
const save = (app, r) => { r.set('__time_operation', true); app.save(r); return r }
const remove = (app, r) => { r.set('__time_operation', true); app.delete(r) }
const safe = (fn) => { try { return fn() } catch (err) { throw new BadRequestError(err.message) } }
const today = () => new DateTime().time().in(new Timezone('Europe/Paris')).format('2006-01-02')
const employee = (app, u) => { const r = get(app, 'hr_employees', u.getString('employee')); if (r.getString('status') !== 'active') throw new BadRequestError('Associez votre compte à un employé actif.'); return r }
const name = (app, id) => { const r = get(app, 'hr_employees', id); return `${r.getString('first_name')} ${r.getString('last_name')}`.trim() }
const reviewers = (app, u) => {
  const boss = u.getString('employee') ? get(app, 'hr_employees', u.getString('employee')).getString('manager') : ''
  const candidates = all(app, 'core_users', 'active = true && id != {:user}', { user: u.id }, 'name,id').filter((v) => can(app, v, 'validate') && (v.getString('time_scope') === 'all' || v.getString('time_scope') === 'reports' && boss && v.getString('employee') === boss))
  const principal = candidates.find((v) => boss && v.getString('employee') === boss)
  return (principal ? [principal] : candidates).map((v) => ({ id: v.id, label: v.getString('name') }))
}
const actions = (app, u, r) => {
  const eligible = u.getString('employee') && require(`${__hooks}/lib/hr-time-policy.js`).be(app, get(app, 'hr_employees', u.getString('employee')))
  const own = r.getString('user') === u.id && r.getString('employee') === u.getString('employee'), status = r.getString('status'), result = []
  if (own && can(app, u, 'write')) { if (status === 'draft' && eligible && r.getString('week_start') <= today()) result.push('edit'); if (status === 'submitted') result.push('withdraw'); if (status === 'rejected') result.push('reopen') }
  if (own && eligible && r.getString('week_start') <= today() && status === 'draft' && can(app, u, 'submit')) result.push('submit')
  if (r.getString('user') !== u.id && r.getString('employee') !== u.getString('employee') && can(app, u, 'validate') && (u.getString('time_scope') === 'all' || r.getString('manager') === u.id && u.getString('time_scope') === 'reports')) { if (status === 'submitted') { if (r.getString('source_provider') === 'horizon' && r.getString('work_type') === 'be') result.push('correct'); result.push('validate', 'reject') } if (status === 'validated') result.push('reopen_validated') }
  return result
}
const audit = (app, u, r, before, label) => {
  policy.audit(app, r.collection().name, r.id, u.id, before, r.publicExport(), before ? 'update' : 'create')
  return require(`${__hooks}/lib/activity.js`).publish(app, r, u.id, 'status_change', label, {})
}
module.exports = { get, all, fields, text, json, can, guard, visible, read, today, save, remove, safe, math, employee, name, reviewers, actions, audit }
