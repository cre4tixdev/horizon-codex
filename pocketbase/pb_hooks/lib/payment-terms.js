const b = require(`${__hooks}/lib/billing-common.js`)
const rows = (app) => app.findAllRecords('settings_payment_terms').map((record) => ({ id: record.id, code: record.getString('code'), label: record.getString('label'), description: record.getString('description'), days: record.getInt('days'), active: record.getBool('active') })).sort((a, c) => a.days - c.days || a.label.localeCompare(c.label))
const defaults = (app, company, date) => {
  const settings = b.settings(app), id = company?.getString('payment_term') || settings.getString('default_payment_term'), term = rows(app).find((term) => term.id === id && term.active) || rows(app).find((term) => term.id === settings.getString('default_payment_term') && term.active)
  const due = new Date(`${b.date(date, true)}T12:00:00Z`); due.setUTCDate(due.getUTCDate() + (term?.days || 0))
  return { payment_term: term?.id || '', payment_terms: term?.description || term?.label || '', due_date: due.toISOString().slice(0, 10) }
}
const save = (app, user, input, defaultId) => {
  if (!Array.isArray(input) || !input.length || input.length > 100) throw new BadRequestError('Configurez les conditions de paiement.')
  const existing = new Map(app.findAllRecords('settings_payment_terms').map((record) => [record.id, record])), seen = new Set(), codes = new Set()
  for (const item of input) {
    b.exact(item, ['id', 'code', 'label', 'description', 'days', 'active']); if (item.id && (!/^[a-z0-9]{15}$/.test(item.id) || seen.has(item.id))) throw new BadRequestError('Condition inconnue ou répétée.')
    const code = b.text(item.code, 40, true); if (!/^[A-Z0-9_-]+$/.test(code) || codes.has(code)) throw new BadRequestError('Code de condition invalide ou répété.'); codes.add(code)
    if (!Number.isInteger(item.days) || typeof item.active !== 'boolean') throw new BadRequestError('Délai entier et état actif requis.')
    const record = existing.has(item.id) ? existing.get(item.id) : new Record(app.findCollectionByNameOrId('settings_payment_terms')), before = existing.has(item.id) ? record.publicExport() : null
    if (!before && item.id) record.id = item.id
    record.set('code', code); record.set('label', b.text(item.label, 120, true)); record.set('description', b.text(item.description || '', 2000)); record.set('days', b.number(item.days, 0, 365)); record.set('active', item.active); record.set('schedule_type', 'days'); app.save(record); seen.add(record.id)
    b.policy.audit(app, 'settings_payment_terms', record.id, user.id, before, record.publicExport(), before ? 'update' : 'create')
  }
  for (const [id, record] of existing) if (!seen.has(id) && record.getBool('active')) { const before = record.publicExport(); record.set('active', false); app.save(record); b.policy.audit(app, 'settings_payment_terms', id, user.id, before, record.publicExport(), 'update') }
  const term = app.findRecordById('settings_payment_terms', defaultId)
  if (!seen.has(defaultId) || !term.getBool('active')) throw new BadRequestError('Choisissez une condition de paiement active par défaut.')
  return term
}
module.exports = { rows, defaults, save, list(event) { const rights = b.policy.permissions(event.app, event.auth); if (!rights.includes('contacts.read') && !rights.includes('billing.read')) throw new ForbiddenError('Accès aux conditions de paiement refusé.'); return event.json(200, { items: rows(event.app), default_id: b.settings(event.app).getString('default_payment_term') }) } }
