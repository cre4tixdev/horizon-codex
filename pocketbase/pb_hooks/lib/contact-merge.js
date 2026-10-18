const { canonical, incoming, authorize } = require(`${__hooks}/lib/merge-common.js`)
const columns = {
  companies: ['logo', 'name', 'legal_name', 'siren', 'siret', 'vat_number', 'lei', 'email', 'phone', 'website', 'notes', 'preferred_language', 'default_currency', 'payment_term', 'billing_email', 'einvoice_routing_address', 'einvoice_platform', 'einvoice_service_code', 'einvoice_status'],
  people: ['avatar', 'first_name', 'last_name', 'job_title', 'company', 'email', 'phone', 'mobile', 'notes'],
}
const table = (kind) => `contacts_${kind}`
const label = (record) => record.collection().name === 'contacts_companies' ? record.getString('name') : [record.getString('first_name'), record.getString('last_name')].filter(Boolean).join(' ')
const records = (app, name, filter, params) => app.findRecordsByFilter(name, filter, 'id', 0, 0, params)
const guard = (e) => {
  authorize(e.app, e.auth, 'contacts')
  const body = e.requestInfo().body
  if (typeof body.kind !== 'string' || !Object.hasOwn(columns, body.kind) || !/^[a-z0-9]{15}$/.test(body.source || '') || !/^[a-z0-9]{15}$/.test(body.target || '') || body.source === body.target || Object.keys(body).some((key) => !['kind', 'source', 'target', 'fingerprint', 'choices', 'confirmed'].includes(key))) throw new BadRequestError('Choisissez deux fiches distinctes du même type.')
  return body
}
const inspect = (app, kind, sourceId, targetId) => {
  const entity = table(kind), source = app.findRecordById(entity, sourceId), target = app.findRecordById(entity, targetId)
  if (!source.getBool('active') || source.getString('merged_into') || !target.getBool('active') || target.getString('merged_into')) throw new BadRequestError('Les deux fiches doivent être actives et non fusionnées.')
  const owned = kind === 'companies' ? ['contacts_people', 'contacts_addresses', 'contacts_company_roles'].map((name) => [name, records(app, name, 'company = {:id}', { id: sourceId }), records(app, name, 'company = {:id}', { id: targetId })]) : []
  const blocks = []
  const candidates = [source, ...owned.filter(([name]) => name !== 'contacts_company_roles').flatMap(([, rows]) => rows)]
  const dependencies = incoming(app, candidates, (record, collection, field) => record.id === source.id && kind === 'companies' && owned.some(([name]) => name === collection) && field === 'company')
  if (dependencies.length) blocks.push('Une fiche à déplacer possède des liens métier, documents ou tâches, ou a déjà absorbé une autre fiche. Conservez-la comme destination ; rapprocher deux historiques métier nécessite un traitement spécifique.')
  if (kind === 'companies') {
    const sourceSiren = source.getString('siren') || source.getString('siret').slice(0, 9)
    const targetSiren = target.getString('siren') || target.getString('siret').slice(0, 9)
    if (sourceSiren && targetSiren && sourceSiren !== targetSiren) blocks.push('Identifiants juridiques incompatibles : vérifiez les deux sociétés avant fusion.')
  }
  if (kind === 'companies') for (const key of ['siren', 'lei', 'vat_number']) if (source.getString(key) && target.getString(key) && source.getString(key).replace(/\s/g, '').toUpperCase() !== target.getString(key).replace(/\s/g, '').toUpperCase()) blocks.push('Identifiants juridiques incompatibles : vérifiez les deux sociétés avant fusion.')
  const refs = require(`${__hooks}/lib/import-reference-merge.js`), external = [...refs.references(app, entity, sourceId), ...refs.references(app, entity, targetId)]
  const display = (record, key) => {
    const id = record.getString(key)
    if (key === 'einvoice_status') return { unknown: 'À vérifier', to_configure: 'À configurer', ready: 'Prêt', not_applicable: 'Non applicable' }[id] || id
    if (!id || !['company', 'payment_term'].includes(key)) return ''
    const linked = app.findRecordById(key === 'company' ? 'contacts_companies' : 'settings_payment_terms', id)
    return key === 'company' ? label(linked) : linked.getString('name')
  }
  const fields = columns[kind].map((key) => ({ key, source: source.getString(key), target: target.getString(key), source_label: display(source, key), target_label: display(target, key) }))
  const identity = (record) => ({ id: record.id, collectionId: record.collection().id, label: label(record) })
  const dto = { kind, source: identity(source), target: identity(target), fields, blockers: [...new Set(blocks)], counts: { people: owned.find(([name]) => name === 'contacts_people')?.[1].length || 0, addresses: owned.find(([name]) => name === 'contacts_addresses')?.[1].length || 0, roles: owned.find(([name]) => name === 'contacts_company_roles')?.[1].filter((record) => record.getBool('active')).length || 0, references: refs.references(app, entity, sourceId).length } }
  dto.fingerprint = $security.sha256(JSON.stringify(canonical([source.publicExport(), target.publicExport(), owned.map(([name, a, b]) => [name, a.map((r) => r.publicExport()), b.map((r) => r.publicExport())]), external.map((r) => r.publicExport()), dependencies])))
  return { dto, source, target, owned }
}
const preview = (e) => { const b = guard(e); return e.json(200, inspect(e.app, b.kind, b.source, b.target).dto) }
const apply = (e) => {
  const b = guard(e)
  if (b.confirmed !== true || typeof b.fingerprint !== 'string' || !b.choices || Array.isArray(b.choices) || typeof b.choices !== 'object' || Object.entries(b.choices).some(([key, value]) => !columns[b.kind].includes(key) || !['source', 'target'].includes(value))) throw new BadRequestError('Confirmez l’aperçu et les valeurs à conserver.')
  let result
  e.app.runInTransaction((app) => {
    authorize(app, e.auth, 'contacts')
    const existing = app.findRecordById(table(b.kind), b.source)
    if (existing.getString('merged_into') === b.target) { result = { id: b.target }; return }
    const { dto, source, target, owned } = inspect(app, b.kind, b.source, b.target)
    if (dto.fingerprint !== b.fingerprint) throw new ApiError(409, 'Les fiches ou leurs liens ont changé. Rechargez l’aperçu avant de confirmer.')
    if (dto.blockers.length) throw new ApiError(409, dto.blockers[0])
    const save = (record) => { record.set('__audit_actor', e.auth.id); app.save(record) }
    for (const field of dto.fields) {
      const fromSource = b.choices[field.key] === 'source' || !b.choices[field.key] && !field.target
      if (['logo', 'avatar'].includes(field.key)) {
        if (fromSource && !field.source) target.set(field.key, '')
        if (fromSource && field.source) {
          const fs = app.newFilesystem()
          try { const reader = fs.getReader(source.baseFilesPath() + '/' + field.source); try { target.set(field.key, $filesystem.fileFromBytes(toBytes(reader), field.source)) } finally { reader.close() } } finally { fs.close() }
        }
      } else target.set(field.key, fromSource ? field.source : field.target)
    }
    save(target)
    for (const [name, rows, targetRows] of owned) for (const record of rows) {
      if (name === 'contacts_company_roles') {
        if (!record.getBool('active')) continue
        let role = targetRows.find((row) => row.getString('role') === record.getString('role'))
        if (!role) { role = new Record(app.findCollectionByNameOrId(name)); role.set('company', target.id); role.set('role', record.getString('role')); targetRows.push(role) }
        role.set('active', true); save(role)
      } else {
        record.set('company', target.id)
        if (name === 'contacts_addresses' && record.getBool('is_primary') && targetRows.some((row) => row.getString('type') === record.getString('type') && row.getBool('is_primary'))) record.set('is_primary', false)
        save(record); targetRows.push(record)
      }
    }
    require(`${__hooks}/lib/import-reference-merge.js`).apply(app, table(b.kind), source.id, target.id)
    source.set('active', false); source.set('merged_into', target.id); source.set('merged_at', new Date().toISOString()); source.set('__merge_operation', true); save(source)
    require(`${__hooks}/lib/access-policy.js`).audit(app, table(b.kind), target.id, e.auth.id, { source: source.id }, { target: target.id, choices: b.choices, counts: dto.counts }, 'merge')
    const activity = require(`${__hooks}/lib/activity.js`)
    activity.publish(app, target, e.auth.id, 'change', `Fusion de la fiche ${label(source)}`, { action: 'merge', source_id: source.id }, '')
    activity.publish(app, source, e.auth.id, 'change', `Fiche fusionnée vers ${label(target)}`, { action: 'merge', target_id: target.id }, '')
    result = { id: target.id }
  })
  return e.json(200, result)
}
const requestGuard = (e) => {
  if (['merged_into', 'merged_at', '__merge_operation', '__contacts_merge'].some((key) => Object.hasOwn(e.requestInfo().body, key))) throw new BadRequestError('La fusion est gérée par l’action dédiée.')
  if (e.record.original().getString('merged_into')) throw new BadRequestError('Cette fiche a été fusionnée et conserve son historique. Ouvrez la fiche conservée.')
}
const identities = (app, kind = 'companies') => {
  const rows = require(`${__hooks}/lib/merge-metadata.js`)(app, table(kind), kind === 'companies' ? ['id', 'name', 'legal_name', 'siren', 'siret', 'email'] : ['id', 'first_name', 'last_name', 'email', 'company'])
  return rows.map((r) => ({ ...r, label: kind === 'companies' ? r.name : [r.first_name, r.last_name].filter(Boolean).join(' '), detail: kind === 'companies' ? [r.legal_name, r.siren || r.siret].filter(Boolean).join(' · ') : r.email }))
}
module.exports = { preview, apply, requestGuard, identities }
