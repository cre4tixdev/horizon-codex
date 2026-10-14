const policy = require(`${__hooks}/lib/access-policy.js`)
const statuses = { draft: 'Brouillon', submitted: 'À valider', returned: 'À corriger', validated: 'Validée', reimbursed: 'Remboursée', cancelled: 'Annulée' }
const get = (app, collection, id) => { if (typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Référence invalide.'); try { return app.findRecordById(collection, id) } catch { throw new ApiError(404, 'Référence introuvable.') } }
const guard = (app, user, action = 'read') => { if (!policy.permissions(app, user).includes('expenses.read') || action !== 'read' && (user.getString('erp_profile') === 'viewer' || !policy.permissions(app, user).includes(`expenses.${action}`))) throw new ForbiddenError('Accès aux notes de frais refusé.') }
const visible = (user, r) => r.getString('user') === user.id || user.getString('expenses_scope') === 'all' || user.getString('expenses_scope') === 'reports' && r.getString('validator') === user.id && Boolean(r.getString('submitted_at')) && r.getString('status') !== 'draft'
const read = (app, user, id) => { guard(app, user); const r = get(app, 'expenses_reports', id); if (!visible(user, r)) throw new ForbiddenError('Cette note est hors de votre périmètre.'); return r }
const revision = (r, updated) => { if (r.getString('updated') !== updated) throw new ApiError(409, 'Cette note a changé. Rechargez-la.') }
const editable = (app, user, r) => { guard(app, user, 'write'); if (r.getString('user') !== user.id || !['draft', 'returned'].includes(r.getString('status')) || r.getString('archived_at')) throw new ForbiddenError('Seul le propriétaire peut modifier son brouillon ou sa note retournée.') }
const fields = (body, allowed) => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((k) => !allowed.includes(k))) throw new BadRequestError('Champs invalides.') }
const text = (value, max = 2000) => { if (typeof value !== 'string' || value.length > max) throw new BadRequestError('Texte invalide.'); return value.trim() }
const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const today = () => new DateTime().time().in(new Timezone('Europe/Paris')).format('2006-01-02')
const date = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
const lines = (app, id) => app.findRecordsByFilter('expenses_lines', 'report = {:id}', 'position,created,id', 0, 0, { id })
const name = (app, collection, id) => { if (!id) return ''; const r = get(app, collection, id); return collection === 'hr_employees' || collection === 'contacts_people' ? `${r.getString('first_name')} ${r.getString('last_name')}`.trim() : r.getString('name') || r.getString('label') || r.getString('title') }
const lineDTO = (app, l) => {
  const snapshot = JSON.parse(l.getString('snapshot') || 'null')
  return { ...l.publicExport(), company_name: snapshot?.company_name ?? name(app, 'contacts_companies', l.getString('company')), contact_name: snapshot?.contact_name ?? name(app, 'contacts_people', l.getString('contact')), opportunity_name: snapshot?.opportunity_name ?? name(app, 'crm_opportunities', l.getString('opportunity')), category_label: snapshot?.category_label ?? name(app, 'expenses_categories', l.getString('category')), guests_names: snapshot?.guests?.map((v) => ({ id: v.id, label: v.name })) || l.getStringSlice('guests').map((id) => ({ id, label: name(app, 'contacts_people', id) })) }
}
const dto = (app, r, details = true) => ({ ...r.publicExport(), employee_name: JSON.parse(r.getString('snapshot') || 'null')?.employee_name ?? name(app, 'hr_employees', r.getString('employee')), validator_name: JSON.parse(r.getString('snapshot') || 'null')?.validator_name ?? name(app, 'core_users', r.getString('validator')), lines: details ? lines(app, r.id).map((l) => lineDTO(app, l)) : [], history: [] })
const event = (app, user, r, before, body, recipient = '', metadata = {}) => {
  policy.audit(app, 'expenses_reports', r.id, user.id, before, r.publicExport(), before ? 'update' : 'create')
  const e = new Record(app.findCollectionByNameOrId('core_activity_events'))
  for (const [k, v] of Object.entries({ source_module: 'expenses', source_entity: 'expenses_reports', source_record_id: r.id, author: user.id, type: before && before.status !== r.getString('status') ? 'status_change' : 'change', body, metadata: { ...metadata, changes: [...metadata.changes || [], ...(before && before.status !== r.getString('status') ? [{ field: 'status', label: 'État', before: statuses[before.status], after: statuses[r.getString('status')] }] : []), ...(metadata.reason ? [{ field: 'reason', label: 'Motif', before: '', after: metadata.reason }] : [])], author: require(`${__hooks}/lib/activity.js`).author(app, user.id) } })) e.set(k, v)
  app.save(e)
  if (recipient && recipient !== user.id) require(`${__hooks}/lib/notification-service.js`)(app, recipient, e, body, `${name(app, 'hr_employees', r.getString('employee'))} · ${r.getString('title')}`)
}
const totals = (app, r) => { const ls = lines(app, r.id); for (const [field, fn] of [['total', (l) => l.getFloat('amount')], ['tax', (l) => l.getFloat('tax_amount')], ['reimbursable_total', (l) => l.getString('payment_method') === 'personal' ? l.getFloat('amount') : 0]]) { const cents = ls.reduce((sum, l) => sum + Math.round(fn(l) * 100), 0); if (!Number.isSafeInteger(cents)) throw new BadRequestError('Total hors limites.'); r.set(field, cents / 100) }; app.save(r) }
const reviewer = (app, owner, requested = '') => {
  const employee = get(app, 'hr_employees', owner.getString('employee')), manager = employee.getString('manager')
  const candidates = app.findRecordsByFilter('core_users', 'active = true && role.active = true && id != {:id}', 'name,id', 0, 0, { id: owner.id }).filter((u) => policy.permissions(app, u).includes('expenses.read') && policy.permissions(app, u).includes('expenses.validate') && u.getString('erp_profile') !== 'viewer' && ['reports', 'all'].includes(u.getString('expenses_scope')) && (!u.getString('employee') || get(app, 'hr_employees', u.getString('employee')).getString('status') === 'active'))
  const principal = candidates.find((u) => manager && u.getString('employee') === manager)
  if (principal) return principal
  const fallback = candidates.find((u) => u.id === requested && u.getString('expenses_scope') === 'all')
  if (!fallback) throw new BadRequestError('Aucun manager habilité disponible. Choisissez un validateur global ou contactez votre administrateur.')
  return fallback
}
const validateLine = (app, user, r, input, submitting = false) => {
  const allowed = ['date', 'category', 'description', 'company', 'contact', 'opportunity', 'internal', 'guests', 'internal_guests', 'route', 'vehicle', 'payment_method', 'amount', 'tax_amount']
  fields(input, allowed)
  const result = Object.fromEntries(['date', 'category', 'description', 'company', 'contact', 'opportunity', 'internal_guests', 'route', 'vehicle'].map((k) => [k, text(input[k] || '', k === 'description' || k === 'internal_guests' ? 2000 : k === 'route' ? 500 : 200)]))
  if (typeof input.internal !== 'boolean' || !Array.isArray(input.guests) || input.guests.length > 30 || new Set(input.guests).size !== input.guests.length || !['personal', 'company'].includes(input.payment_method)) throw new BadRequestError('Informations de dépense invalides.')
  if (!date(result.date) || result.date.slice(0, 7) !== r.getString('month')) throw new BadRequestError('La dépense doit appartenir au mois de la note.')
  Object.assign(result, { internal: input.internal, guests: input.guests, payment_method: input.payment_method, currency: 'EUR', analytic_account: '' }, require(`${__hooks}/lib/tax.js`).expense(input.amount, input.tax_amount))
  const category = result.category ? get(app, 'expenses_categories', result.category) : null
  if (category && !category.getBool('active')) throw new BadRequestError('Cette catégorie est inactive.')
  if (result.internal && (result.opportunity || result.company || result.contact)) throw new BadRequestError('Choisissez Frais internes ou un rattachement client.')
  if (result.opportunity) {
    if (!policy.permissions(app, user).includes('crm.read')) throw new ForbiddenError('Accès CRM nécessaire pour rattacher une affaire.')
    const opportunity = get(app, 'crm_opportunities', result.opportunity)
    if (!opportunity.getBool('active')) throw new BadRequestError('Cette opportunité est archivée.')
    result.company = opportunity.getString('company'); result.contact = result.contact || opportunity.getString('contact'); result.analytic_account = opportunity.getString('analytic_account')
    if (!result.analytic_account) throw new BadRequestError('Cette affaire ne possède pas de compte analytique.')
  }
  if ((result.company || result.contact || input.guests.length) && !policy.permissions(app, user).includes('contacts.read')) throw new ForbiddenError('Accès Contacts nécessaire pour ces rattachements.')
  if (result.company && !get(app, 'contacts_companies', result.company).getBool('active')) throw new BadRequestError('Cette société est archivée.')
  if (result.contact) { const contact = get(app, 'contacts_people', result.contact); if (!contact.getBool('active')) throw new BadRequestError('Ce contact est archivé.'); if (result.company && contact.getString('company') !== result.company) throw new BadRequestError('Ce contact n’appartient pas à la société choisie.'); if (!result.company) result.company = contact.getString('company') }
  for (const id of input.guests) if (!get(app, 'contacts_people', id).getBool('active')) throw new BadRequestError('Un invité est archivé.')
  if (submitting && (!category || !result.description || result.amount <= 0 || !result.internal && !result.company && !result.contact)) throw new BadRequestError('Complétez catégorie, motif, montant et rattachement de chaque dépense.')
  if (submitting && category.getString('mode') === 'meal' && !result.guests.length && !result.internal_guests) throw new BadRequestError('Indiquez les participants du restaurant.')
  if (submitting && category.getString('mode') === 'travel' && !result.route) throw new BadRequestError('Indiquez le trajet ou le lieu du séjour.')
  if (submitting && category.getString('mode') === 'fuel' && !result.vehicle) throw new BadRequestError('Indiquez le véhicule pour le carburant.')
  return result
}
module.exports = {
  activitySource(app, user, id, write = false) {
    const r = read(app, user, id)
    if (write) {
      const rights = policy.permissions(app, user)
      if (user.getString('erp_profile') === 'viewer' || r.getString('archived_at') || !(r.getString('user') === user.id && rights.includes('expenses.write') || r.getString('validator') === user.id && rights.includes('expenses.validate') || user.getString('expenses_scope') === 'all' && (rights.includes('expenses.write') || rights.includes('expenses.validate')))) throw new ForbiddenError('Contribution au fil de cette note refusée.')
    }
    return r
  },
  choices(e) {
    guard(e.app, e.auth)
    const rights = policy.permissions(e.app, e.auth), owner = e.auth, linked = owner.getString('employee') ? get(e.app, 'hr_employees', owner.getString('employee')) : null
    let principal = ''; try { principal = reviewer(e.app, owner).id } catch (error) { if (!(error instanceof BadRequestError)) throw error }
    const companies = rights.includes('contacts.read') ? e.app.findRecordsByFilter('contacts_companies', 'active = true', 'name', 0, 0).map((r) => ({ id: r.id, label: r.getString('name') })) : []
    const contacts = rights.includes('contacts.read') ? e.app.findRecordsByFilter('contacts_people', 'active = true', 'last_name,first_name', 0, 0).map((r) => ({ id: r.id, company: r.getString('company'), label: name(e.app, 'contacts_people', r.id) })) : []
    const opportunities = rights.includes('crm.read') ? e.app.findRecordsByFilter('crm_opportunities', 'active = true', 'title', 0, 0).map((r) => ({ id: r.id, label: `${r.getString('opportunity_number')} · ${r.getString('title')}`, company: r.getString('company'), contact: r.getString('contact') })) : []
    const validators = e.app.findRecordsByFilter('core_users', 'active = true && role.active = true && id != {:id}', 'name', 0, 0, { id: e.auth.id }).filter((u) => policy.permissions(e.app, u).includes('expenses.validate') && (u.id === principal || u.getString('expenses_scope') === 'all') && u.getString('erp_profile') !== 'viewer').map((u) => ({ id: u.id, label: u.getString('name') }))
    return e.json(200, { employee: linked?.id || '', employee_name: linked ? name(e.app, 'hr_employees', linked.id) : '', default_validator: principal, validators, categories: e.app.findRecordsByFilter('expenses_categories', '', 'sort_order,label', 0, 0).map((r) => r.publicExport()), companies, contacts, opportunities, can_review: (rights.includes('expenses.validate') || rights.includes('expenses.reimburse')) && ['reports', 'all'].includes(e.auth.getString('expenses_scope')), can_reimburse: rights.includes('expenses.reimburse') && e.auth.getString('expenses_scope') === 'all', global: e.auth.getString('expenses_scope') === 'all' })
  },
  list(e) {
    guard(e.app, e.auth)
    const q = e.request.url.query(), area = q.get('area') || 'own'
    if (!['own', 'review'].includes(area)) throw new BadRequestError('Vue invalide.')
    if (area === 'review' && !['reports', 'all'].includes(e.auth.getString('expenses_scope'))) throw new ForbiddenError('Vue manager indisponible.')
    const statusesFilter = q.get('status') || '', selected = statusesFilter ? statusesFilter.split(',') : []
    if (selected.some((s) => !Object.hasOwn(statuses, s))) throw new BadRequestError('État invalide.')
    let filter = area === 'own' ? 'user = {:user}' : e.auth.getString('expenses_scope') === 'all' ? 'user != {:user}' : 'validator = {:user} && user != {:user} && submitted_at != "" && status != "draft"'
    const params = { user: e.auth.id, q: text(q.get('q') || '', 200) }
    filter += q.get('state') === 'archived' ? ' && archived_at != ""' : ' && archived_at = ""'
    if (params.q) filter += ' && (title ~ {:q} || month ~ {:q} || employee.first_name ~ {:q} || employee.last_name ~ {:q} || notes ~ {:q})'
    if (q.get('month')) { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(q.get('month'))) throw new BadRequestError('Mois invalide.'); params.month = q.get('month'); filter += ' && month = {:month}' }

    const sort = ({ '-month': '-month,-created,id', month: 'month,created,id', employee: 'employee.last_name,employee.first_name,-month,id', amount: '-reimbursable_total,-month,id' })[q.get('sort') || '-month']
    if (!sort) throw new BadRequestError('Tri invalide.')
    const records = e.app.findRecordsByFilter('expenses_reports', filter, sort, 0, 0, params), summary = Object.fromEntries(Object.keys(statuses).map((s) => [s, records.filter((r) => r.getString('status') === s).length])), selectedRecords = records.filter((r) => !selected.length || selected.includes(r.getString('status')))
    const totalItems = selectedRecords.length, totalPages = Math.max(1, Math.ceil(totalItems / 30)), page = Math.min(totalPages, Math.max(1, Math.trunc(Number(q.get('page'))) || 1))
    return e.json(200, { items: selectedRecords.slice((page - 1) * 30, page * 30).map((r) => dto(e.app, r, false)), page, totalItems, totalPages, summary })
  },
  record(e) { return e.json(200, dto(e.app, read(e.app, e.auth, e.request.pathValue('id')))) },
  save(e) {
    guard(e.app, e.auth, 'write'); const body = e.requestInfo().body; fields(body, ['id', 'updated', 'month', 'notes', 'validator', 'supplement_of', 'creation_key'])
    let saved
    e.app.runInTransaction((app) => {
      const owner = get(app, 'core_users', e.auth.id); guard(app, owner, 'write')
      const employee = get(app, 'hr_employees', owner.getString('employee')); if (employee.getString('status') !== 'active') throw new BadRequestError('Un employé actif doit être associé à votre compte.')
      const key = text(body.creation_key || '', 100), hash = $security.sha256(JSON.stringify({ month: body.month, notes: body.notes || '', validator: body.validator || '', supplement_of: body.supplement_of || '' })); if (!body.id && key.length < 10) throw new BadRequestError('Clé de création requise.')
      const duplicate = !body.id && app.findRecordsByFilter('expenses_reports', 'creation_key = {:key}', '', 1, 0, { key })[0]
      if (duplicate) { if (duplicate.getString('user') !== owner.id || duplicate.getString('creation_hash') !== hash) throw new ApiError(409, 'Clé déjà utilisée.'); saved = duplicate; return }
      const r = body.id ? read(app, owner, body.id) : new Record(app.findCollectionByNameOrId('expenses_reports')), before = body.id ? r.publicExport() : null
      if (body.id) editable(app, owner, r), revision(r, body.updated)
      const month = text(body.month, 7); if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestError('Mois invalide.')
      if (body.id && r.getString('supplement_of') && month !== r.getString('month')) throw new BadRequestError('Un complément conserve le mois de sa note d’origine.')
      if (body.id && month !== r.getString('month') && app.findRecordsByFilter('expenses_reports', 'employee = {:employee} && month = {:month} && supplement_of = "" && id != {:id}', '', 1, 0, { employee: r.getString('employee'), month, id: r.id }).length) throw new ApiError(409, 'Une note existe déjà pour ce mois. Le déplacement n’a pas été enregistré.')
      const supplement = text(body.supplement_of || '', 15)
      if (!body.id && supplement) { const original = read(app, owner, supplement); if (original.getString('user') !== owner.id || original.getString('month') !== month || !['validated', 'reimbursed'].includes(original.getString('status'))) throw new BadRequestError('Complément réservé à votre note validée du même mois.') }
      if (!body.id && !supplement && app.findRecordsByFilter('expenses_reports', 'employee = {:employee} && month = {:month} && supplement_of = ""', '', 1, 0, { employee: employee.id, month }).length) throw new ApiError(409, 'Une note existe déjà pour ce mois. Ouvrez-la ou créez un complément après validation.')
      if (!body.id) for (const [k, v] of Object.entries({ user: owner.id, employee: employee.id, month, supplement_of: supplement, title: `${supplement ? 'Complément · ' : ''}${months[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`, status: 'draft', currency: 'EUR', exchange_rate: 1, tax_exchange_rate: 1, creation_key: key, creation_hash: hash })) r.set(k, v)
      r.set('month', month); r.set('title', `${r.getString('supplement_of') ? 'Complément · ' : ''}${months[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`)
      r.set('notes', text(body.notes || '', 5000)); r.set('validator', text(body.validator || '', 15)); if (r.getString('validator')) r.set('validator', reviewer(app, owner, r.getString('validator')).id)
      app.save(r); event(app, owner, r, before, before ? 'Note mise à jour' : 'Fiche créée', '', before && before.month !== month ? { action: 'update', changes: [{ field: 'month', label: 'Mois', before: before.month, after: month }] } : { action: before ? 'update' : 'create' }); saved = r
    })
    return e.json(200, dto(e.app, saved))
  },
  line(e) {
    const raw = e.requestInfo().body; fields(raw, ['input', 'id', 'updated', 'removed'])
    let input = raw.input; if (typeof input === 'string') { try { input = JSON.parse(input) } catch { throw new BadRequestError('Dépense invalide.') } }
    let saved
    e.app.runInTransaction((app) => {
      const owner = get(app, 'core_users', e.auth.id), r = read(app, owner, e.request.pathValue('id')); editable(app, owner, r); revision(r, raw.updated)
      const before = r.publicExport(), l = raw.id ? get(app, 'expenses_lines', raw.id) : new Record(app.findCollectionByNameOrId('expenses_lines'))
      if (raw.id && l.getString('report') !== r.id) throw new ForbiddenError('Cette dépense appartient à une autre note.')
      const values = validateLine(app, owner, r, input)
      let removed = raw.removed || []; if (typeof removed === 'string') { try { removed = JSON.parse(removed) } catch { throw new BadRequestError('Pièces invalides.') } }
      const kept = l.getStringSlice('receipt'); if (!Array.isArray(removed) || removed.some((v) => !kept.includes(v))) throw new BadRequestError('Pièce à retirer invalide.')
      let files = []; if (e.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { files = e.findUploadedFiles('receipt') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } };  if (kept.length - removed.length + files.length > 20) throw new BadRequestError('20 justificatifs maximum par dépense.')
      for (const [k, v] of Object.entries(values)) l.set(k, v)
      l.set('report', r.id); if (!raw.id) l.set('position', lines(app, r.id).reduce((m, l) => Math.max(m, l.getInt('position')), 0) + 1)
      l.set('receipt', [...kept.filter((v) => !removed.includes(v)), ...files]); app.save(l); totals(app, r)
      event(app, owner, r, before, raw.id ? 'Dépense mise à jour' : 'Dépense ajoutée', '', { line_id: l.id }); saved = r
    })
    return e.json(200, dto(e.app, saved))
  },
  order(e) {
    const body = e.requestInfo().body; fields(body, ['updated', 'ids']); let saved
    e.app.runInTransaction((app) => { const r = read(app, e.auth, e.request.pathValue('id')); editable(app, e.auth, r); revision(r, body.updated); const ls = lines(app, r.id); if (!Array.isArray(body.ids) || body.ids.length !== ls.length || new Set(body.ids).size !== ls.length || body.ids.some((id) => !ls.some((l) => l.id === id))) throw new BadRequestError('Ordre de lignes invalide.'); const before = r.publicExport(); body.ids.forEach((id, i) => { const l = ls.find((l) => l.id === id); l.set('position', i + 1); app.save(l) }); totals(app, r); event(app, e.auth, r, before, 'Ordre des dépenses modifié'); saved = r }); return e.json(200, dto(e.app, saved))
  },
  remove(e) {
    const body = e.requestInfo().body; fields(body, ['updated', 'line_id']); let saved
    e.app.runInTransaction((app) => { const r = read(app, e.auth, e.request.pathValue('id')); editable(app, e.auth, r); revision(r, body.updated); const l = get(app, 'expenses_lines', body.line_id); if (l.getString('report') !== r.id) throw new ForbiddenError('Dépense hors de cette note.'); const before = r.publicExport(); app.delete(l); totals(app, r); event(app, e.auth, r, before, 'Dépense retirée', '', { line_id: l.id }); saved = r }); return e.json(200, dto(e.app, saved))
  },
  transition(e) {
    const body = e.requestInfo().body; fields(body, ['updated', 'action', 'reason', 'date', 'reference', 'validator']); let saved
    e.app.runInTransaction((app) => {
      const user = get(app, 'core_users', e.auth.id), r = read(app, user, e.request.pathValue('id')); revision(r, body.updated); const before = r.publicExport(), status = r.getString('status'), now = new Date().toISOString(); let recipient = '', label
      if (r.getString('archived_at') && !['restore'].includes(body.action)) throw new BadRequestError('Réactivez cette note avant toute action.')
      if (body.action === 'submit') {
        editable(app, user, r); guard(app, user, 'submit'); const ownerEmployee = get(app, 'hr_employees', user.getString('employee')); if (ownerEmployee.id !== r.getString('employee') || ownerEmployee.getString('status') !== 'active') throw new BadRequestError('Employé associé inactif ou modifié.')
        const ls = lines(app, r.id); if (!ls.length) throw new BadRequestError('Ajoutez au moins une dépense.')
        for (const l of ls) { const input = Object.fromEntries(['date', 'category', 'description', 'company', 'contact', 'opportunity', 'internal', 'guests', 'internal_guests', 'route', 'vehicle', 'payment_method', 'amount', 'tax_amount'].map((k) => [k, l.publicExport()[k]])); validateLine(app, user, r, input, true); if (!l.getStringSlice('receipt').length) throw new BadRequestError(`Justificatif manquant : ${l.getString('description') || 'dépense'}.`) }
        const v = reviewer(app, user, r.getString('validator')); r.set('validator', v.id); r.set('status', 'submitted'); r.set('submitted_at', now); recipient = v.id; label = 'Note de frais à valider'
      } else if (['validate', 'return'].includes(body.action)) {
        guard(app, user, 'validate'); if (status !== 'submitted' || user.id === r.getString('user') || r.getString('validator') !== user.id) throw new ForbiddenError('Seul le validateur désigné peut décider de cette note ; aucune auto-validation.')
        if (body.action === 'return') { const reason = text(body.reason || '', 2000); if (!reason) throw new BadRequestError('Indiquez le motif de retour.'); r.set('status', 'returned'); r.set('return_reason', reason); label = 'Note de frais à corriger' }
        else { for (const l of lines(app, r.id)) { l.set('snapshot', { ...lineDTO(app, l), category_mode: get(app, 'expenses_categories', l.getString('category')).getString('mode'), guests: l.getStringSlice('guests').map((id) => ({ id, name: name(app, 'contacts_people', id) })), analytic_account: l.getString('analytic_account'), currency: 'EUR' }); app.save(l) }; r.set('snapshot', { employee_name: name(app, 'hr_employees', r.getString('employee')), validator_name: name(app, 'core_users', r.getString('validator')), currency: 'EUR', exchange_rate: 1, tax_exchange_rate: 1, tax_context: { basis: 'receipt', deductibility: 'unassessed' }, total: r.getFloat('total'), tax: r.getFloat('tax'), reimbursable_total: r.getFloat('reimbursable_total') }); r.set('status', 'validated'); r.set('validated_by', user.id); r.set('validated_at', now); label = 'Note de frais validée' }
        recipient = r.getString('user')
      } else if (body.action === 'reimburse') {
        guard(app, user, 'reimburse'); if (user.getString('expenses_scope') !== 'all' || status !== 'validated') throw new ForbiddenError('Remboursement réservé à la gestion globale des notes validées.'); if (!date(body.date || '') || body.date > today() || !text(body.reference || '', 200)) throw new BadRequestError('Date passée ou courante et référence de remboursement requises.'); r.set('status', 'reimbursed'); r.set('reimbursed_at', now); r.set('reimbursed_by', user.id); r.set('reimbursement_date', body.date); r.set('reimbursement_reference', body.reference.trim()); recipient = r.getString('user'); label = r.getFloat('reimbursable_total') > 0 ? 'Note de frais remboursée' : 'Note clôturée sans remboursement'
      } else if (body.action === 'cancel') {
        editable(app, user, r); r.set('status', 'cancelled'); label = 'Note annulée'
      } else if (body.action === 'reassign') {
        guard(app, user, 'validate'); if (user.getString('expenses_scope') !== 'all' || status !== 'submitted') throw new ForbiddenError('Réaffectation réservée au gestionnaire global.'); const v = get(app, 'core_users', body.validator); guard(app, v, 'validate'); if (!['all', 'reports'].includes(v.getString('expenses_scope')) || v.id === r.getString('user')) throw new BadRequestError('Validateur invalide.'); if (v.getString('expenses_scope') !== 'all' && get(app, 'hr_employees', v.getString('employee')).id !== get(app, 'hr_employees', r.getString('employee')).getString('manager')) throw new BadRequestError('Ce manager ne supervise pas cet employé.'); const reason = text(body.reason || '', 2000); if (!reason) throw new BadRequestError('Motif de réaffectation requis.'); r.set('validator', v.id); recipient = v.id; label = 'Validation de note réaffectée'
      } else if (body.action === 'reopen') {
        guard(app, user, 'write'); if (r.getString('user') !== user.id || status !== 'cancelled') throw new ForbiddenError('Seul le propriétaire peut reprendre une note annulée.'); r.set('status', 'draft'); label = 'Note reprise en brouillon'
      } else if (['archive', 'restore'].includes(body.action)) {
        guard(app, user, 'write'); if (r.getString('user') !== user.id && user.getString('expenses_scope') !== 'all' || !['reimbursed', 'cancelled'].includes(status)) throw new ForbiddenError('Archivage réservé aux notes clôturées.'); r.set('archived_at', body.action === 'archive' ? now : ''); label = body.action === 'archive' ? 'Note archivée' : 'Note réactivée'
      } else throw new BadRequestError('Action invalide.')
      totals(app, r); event(app, user, r, before, label, recipient, { action: body.action, reason: body.reason || '', validator: r.getString('validator') }); saved = r
    })
    return e.json(200, dto(e.app, saved))
  },
  categories(e) { if (!policy.settings(e.app, e.auth)) throw new ForbiddenError('Paramètres réservés à Admin et Superuser.'); return e.json(200, e.app.findRecordsByFilter('expenses_categories', '', 'sort_order,label', 0, 0).map((r) => r.publicExport())) },
  category(e) {
    if (!policy.settings(e.app, e.auth)) throw new ForbiddenError('Paramètres réservés à Admin et Superuser.')
    const body = e.requestInfo().body; fields(body, ['id', 'updated', 'code', 'label', 'mode', 'active', 'sort_order']); let saved
    e.app.runInTransaction((app) => { const r = body.id ? get(app, 'expenses_categories', body.id) : new Record(app.findCollectionByNameOrId('expenses_categories')); if (body.id) revision(r, body.updated); const before = body.id ? r.publicExport() : null; const code = text(body.code, 35), label = text(body.label, 120); if (!/^[A-Z0-9_]+$/.test(code) || !label || !['general', 'meal', 'travel', 'fuel', 'purchase'].includes(body.mode) || typeof body.active !== 'boolean' || !Number.isSafeInteger(body.sort_order) || body.sort_order < 0) throw new BadRequestError('Catégorie invalide.'); if (body.id && (code !== r.getString('code') || body.mode !== r.getString('mode')) && app.findRecordsByFilter('expenses_lines', 'category = {:id}', '', 1, 0, { id: r.id }).length) throw new BadRequestError('Code et comportement d’une catégorie utilisée sont conservés.'); for (const [k, v] of Object.entries({ code, label, mode: body.mode, active: body.active, sort_order: body.sort_order })) r.set(k, v); app.save(r); policy.audit(app, 'expenses_categories', r.id, e.auth.id, before, r.publicExport(), before ? 'update' : 'create'); saved = r }); return e.json(200, saved.publicExport())
  },
}
