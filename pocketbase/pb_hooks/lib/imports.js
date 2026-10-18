const adapter = () => require(`${__hooks}/lib/contacts-import.js`)
const json = (record, key) => JSON.parse(record.getString(key) || '{}')
const guard = (e) => {
  if (!e.auth || e.auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = e.app.findRecordById('core_users', e.auth.id), rights = require(`${__hooks}/lib/access-policy.js`).permissions(e.app, user)
  if (user.getString('erp_profile') === 'viewer' || !['contacts.read', 'contacts.write', 'contacts.import'].every((r) => rights.includes(r))) throw new ForbiddenError('Le droit Importer et la modification des Contacts sont nécessaires.')
  return user
}
const owned = (app, user, id) => {
  if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Import invalide.')
  const record = app.findRecordsByFilter('core_import_jobs', 'id = {:id} && created_by = {:user}', '', 1, 0, { id, user: user.id })[0]
  if (!record) throw new ApiError(404, 'Import introuvable.')
  return record
}
const rows = (app, job) => app.findRecordsByFilter('core_import_rows', 'job = {:id}', 'row_number,id', 0, 0, { id: job.id })
const dto = (app, job, selected = rows(app, job)) => ({ id: job.id, type: job.getString('type'), source: job.getString('source'), filename: job.getString('filename'), status: job.getString('status'), mode: job.getString('mode'), mapped_fields: Object.keys(json(job, 'mapping')), created: job.getString('created'), summary: json(job, 'summary'), error: job.getString('error'), rows: selected.map((row) => {
  const staged = json(row, 'normalized_data')
  return { id: row.id, number: row.getInt('row_number'), status: row.getString('status'), action: staged.plan?.status || 'error', data: staged.plan?.data || staged.input, before: json(row, 'before'), match: row.getString('match_type'), target: row.getString('matched_record_id'), error: row.getString('error'), resolution: row.getString('resolution'), candidates: staged.plan?.candidates || [] }
}) })
const summarize = (app, job) => {
  const summary = { total: 0, create: 0, update: 0, skip: 0, conflict: 0, error: 0, applied: 0 }
  const counts = arrayOf(new DynamicModel({ status: '', action: '', count: 0 }))
  app.db().newQuery("SELECT status, COALESCE(json_extract(normalized_data, '$.plan.status'), '') AS action, COUNT(*) AS count FROM core_import_rows WHERE job = {:job} GROUP BY status, action").bind({ job: job.id }).all(counts)
  for (const row of counts) { summary.total += row.count; if (row.status === 'applied') summary.applied += row.count; const action = row.status === 'applied' ? row.action : row.status; if (Object.hasOwn(summary, action)) summary[action] += row.count }
  job.set('summary', summary); app.save(job); return summary
}
const duplicateMatch = 'Doublon dans le fichier : ignorez une des lignes'
const nameMatch = 'Nom identique dans le fichier : création distincte à confirmer'
const nameKey = (type, plan) => {
  const data = { ...plan.before, ...plan.data }
  const names = type === 'companies' ? [data.name || ''] : [data.first_name || '', data.last_name || '', data.company || '']
  return names.slice(0, type === 'companies' ? 1 : 2).some(Boolean) ? JSON.stringify(names) : ''
}
const identities = (source, plan) => {
  const result = ['source:' + source], data = plan.data
  if (plan.record_id) result.push('record:' + plan.record_id)
  for (const key of ['siret', 'siren']) if (data[key]) result.push(key + ':' + data[key])
  if (data.email) result.push('email:' + data.email + ':' + (data.company || plan.before?.company || ''))
  if (!data.siren && !data.siret && !data.email) result.push('name:' + String(data.name || [data.first_name, data.last_name].filter(Boolean).join(' ')).toLowerCase() + ':' + (data.company || ''))
  return result
}
const prepareRow = (app, job, row) => {
  const staged = json(row, 'normalized_data')
  try {
    const plan = adapter().plan(app, job.getString('type'), staged.input, job.getString('namespace'), row.getString('source_key'), job.getString('mode'), row.getString('resolution'))
    row.set('normalized_data', { input: staged.input, plan, base: { status: plan.status, match: plan.match, candidates: plan.candidates } }); row.set('status', plan.status); row.set('before', plan.before); row.set('fingerprint', plan.fingerprint); row.set('matched_record_id', plan.record_id); row.set('match_type', plan.match); row.set('error', '')
    return plan
  } catch (error) {
    if (![400, 404].includes(error.status)) app.logger().error('Import row preparation failed', 'job_id', job.id, 'row', row.getInt('row_number'), 'exception', error.name || 'Error')
    row.set('status', 'error'); row.set('error', error.status === 400 ? error.message : 'Impossible de préparer cette ligne. Vérifiez les valeurs et rattachements.'); row.set('normalized_data', { input: staged.input }); row.set('matched_record_id', ''); row.set('before', {}); row.set('fingerprint', ''); row.set('match_type', '')
    return null
  }
}
const markDuplicate = (row, plan, match = duplicateMatch) => {
  plan.status = 'conflict'; plan.match = match; plan.candidates = []
  row.set('normalized_data', { ...json(row, 'normalized_data'), plan }); row.set('status', plan.status); row.set('match_type', plan.match)
}
const evaluate = (app, job) => {
  const seen = new Set(), names = new Set()
  for (const row of rows(app, job)) {
    if (row.getString('status') === 'applied') continue
    const plan = prepareRow(app, job, row)
    if (plan && plan.status !== 'skip') {
      const keys = identities(row.getString('source_key'), plan)
      const identity = nameKey(job.getString('type'), plan), baseStatus = plan.status, duplicate = keys.some((key) => seen.has(key))
      if (duplicate) markDuplicate(row, plan)
      else if (baseStatus === 'create' && row.getString('resolution') !== 'create' && identity && names.has(identity)) markDuplicate(row, plan, nameMatch)
      if (!duplicate && ['create', 'update'].includes(baseStatus) && identity) names.add(identity)
      for (const key of keys) seen.add(key)
    }
    app.save(row)
  }
  summarize(app, job)
}
// Read only duplicate identities, never unrelated image payloads or Contact snapshots.
const evaluateChange = (app, job, changed) => {
  prepareRow(app, job, changed); app.save(changed)
  const columns = ['siret', 'siren', 'email', 'company', 'name', 'first_name', 'last_name']
  const beforeColumns = ['name', 'first_name', 'last_name', 'company']
  const entries = arrayOf(new DynamicModel(Object.fromEntries(['id', 'status', 'source_key', 'match_type', 'record_id', 'resolution', 'base_status', ...columns, ...beforeColumns.map((key) => 'before_' + key)].map((key) => [key, '']))))
  const projected = columns.map((key) => `COALESCE(json_extract(normalized_data, '$.plan.data.${key}'), '') AS ${key}`).concat(beforeColumns.map((key) => `COALESCE(json_extract(normalized_data, '$.plan.before.${key}'), '') AS before_${key}`))
  app.db().newQuery(`SELECT id, status, source_key, match_type, resolution, matched_record_id AS record_id, COALESCE(json_extract(normalized_data, '$.base.status'), '') AS base_status, ${projected.join(', ')} FROM core_import_rows WHERE job = {:job} ORDER BY row_number, id`).bind({ job: job.id }).all(entries)
  const seen = new Set(), names = new Set(), patches = new Map([[changed.id, changed]])
  for (const entry of entries) {
    if (['skip', 'error', 'applied'].includes(entry.status)) continue
    let plan = { status: entry.base_status || entry.status, record_id: entry.record_id, data: Object.fromEntries(columns.filter((key) => entry[key] !== '').map((key) => [key, entry[key]])), before: Object.fromEntries(beforeColumns.map((key) => [key, entry['before_' + key]])) }
    let keys = identities(entry.source_key, plan), duplicate = keys.some((key) => seen.has(key))
    let row = patches.get(entry.id)
    // Old preparations did not retain the base decision underneath duplicate warnings.
    if (!entry.base_status && entry.match_type === duplicateMatch && !duplicate) {
      row = app.findRecordById('core_import_rows', entry.id); plan = prepareRow(app, job, row)
      if (plan && plan.status !== 'skip') { keys = identities(entry.source_key, plan); duplicate = keys.some((key) => seen.has(key)) } else keys = []
    }
    const identity = plan ? nameKey(job.getString('type'), plan) : ''
    const baseStatus = plan?.status
    const match = duplicate ? duplicateMatch : baseStatus === 'create' && entry.resolution !== 'create' && identity && names.has(identity) ? nameMatch : ''
    const synthetic = [duplicateMatch, nameMatch].includes(entry.match_type)
    if ((match && entry.match_type !== match) || (!match && synthetic && entry.base_status) || row) {
      row = row || app.findRecordById('core_import_rows', entry.id)
      const staged = json(row, 'normalized_data')
      if (staged.plan) {
        const restored = { ...staged.plan, ...staged.base }
        row.set('normalized_data', { ...staged, plan: restored }); row.set('status', restored.status); row.set('match_type', restored.match)
        if (match) markDuplicate(row, restored, match)
      }
      app.save(row); patches.set(row.id, row)
    }
    if (!duplicate && ['create', 'update'].includes(baseStatus) && identity) names.add(identity)
    for (const key of keys) seen.add(key)
  }
  summarize(app, job)
  return Array.from(patches.values())
}
const exact = (body, fields) => { if (!body || Object.keys(body).some((key) => !fields.includes(key))) throw new BadRequestError('Paramètres d’import invalides.') }
module.exports = { guard, exact, owned, json,
  preview(e) {
    const user = guard(e), b = e.requestInfo().body
    exact(b, ['type', 'source', 'filename', 'namespace', 'key', 'headers', 'rows', 'mapping', 'mode'])
    if (!['companies', 'people'].includes(b.type) || !['file', 'odoo'].includes(b.source) || !['create', 'update', 'upsert'].includes(b.mode) || typeof b.filename !== 'string' || !b.filename || b.filename.length > 255 || typeof b.namespace !== 'string' || b.namespace.length > 255 || !/^[a-zA-Z0-9-]{16,80}$/.test(b.key || '') || !Array.isArray(b.headers) || !b.headers.length || b.headers.length > 60 || b.headers.some((h) => typeof h !== 'string' || h.length > 160) || !Array.isArray(b.rows) || !b.rows.length || (b.source === 'file' && b.rows.length > 1000) || b.rows.some((r) => !Array.isArray(r) || r.length !== b.headers.length || r.some((v) => typeof v !== 'string' || v.length > 200000)) || !b.mapping || typeof b.mapping !== 'object' || !Object.keys(b.mapping).length || Array.isArray(b.mapping) || Object.keys(b.mapping).some((k) => !Object.hasOwn(adapter().fields[b.type], k) || !Number.isInteger(b.mapping[k]) || b.mapping[k] < 0 || b.mapping[k] >= b.headers.length)) throw new BadRequestError('Source invalide : 60 colonnes, 10 000 caractères par cellule et 1 000 lignes pour les fichiers maximum.')
    if (JSON.stringify(b).length > 8000000) throw new BadRequestError('Le contenu dépasse 8 Mo. Scindez le fichier.');
    if (b.source === 'odoo') {
      const connection = e.app.findRecordsByFilter('settings_import_odoo', 'key = "default"', '', 1, 0)[0]
      if (!connection || b.namespace !== connection.getString('base_url') + '|' + connection.getString('database') || b.mapping.external_id !== b.headers.indexOf('external_id')) throw new BadRequestError('La source Odoo ou son identifiant a changé. Relisez les données depuis la connexion configurée.')
    }
    let result
    e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth })
      const existing = app.findRecordsByFilter('core_import_jobs', 'created_by = {:user} && creation_key = {:key}', '', 1, 0, { user: user.id, key: b.key })[0]
      if (existing) { result = dto(app, existing); return }
      const job = new Record(app.findCollectionByNameOrId('core_import_jobs'))
      const namespace = b.source === 'file' ? 'file:' + user.id + ':' + $security.sha256(b.namespace || b.filename) : 'odoo:' + $security.sha256(b.namespace)
      for (const [k, v] of Object.entries({ type: b.type, source: b.source, filename: b.filename, namespace, creation_key: b.key, status: 'preview', mode: b.mode, created_by: user.id, mapping: b.mapping })) job.set(k, v)
      app.save(job)
      const hash = $security.sha256(JSON.stringify({ headers: b.headers, rows: b.rows }))
      b.rows.forEach((cells, index) => {
        const input = Object.fromEntries(Object.entries(b.mapping).map(([key, column]) => [key, cells[column]]))
        const row = new Record(app.findCollectionByNameOrId('core_import_rows'))
        for (const [k, v] of Object.entries({ job: job.id, row_number: index + 1, source_key: input.external_id?.trim() && input.external_id.trim().length <= 255 ? input.external_id.trim() : hash + ':' + (index + 1), normalized_data: { input }, status: 'error' })) row.set(k, v)
        app.save(row)
      })
      evaluate(app, job); result = dto(app, job)
    })
    return e.json(200, result)
  },
  resolve(e) {
    const user = guard(e), b = e.requestInfo().body; exact(b, ['row', 'resolution', 'values'])
    if (!/^[a-z0-9]{15}$/.test(b.row || '') || !/^(skip|create|target:[a-z0-9]{15}|)$/.test(b.resolution || '')) throw new BadRequestError('Résolution invalide.')
    let result
    e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth }); const job = owned(app, user, e.request.pathValue('id'))
      if (job.getString('status') !== 'preview') throw new ApiError(409, 'Cet import est verrouillé. Préparez une nouvelle simulation.')
      const row = app.findRecordsByFilter('core_import_rows', 'job = {:job} && id = {:row}', '', 1, 0, { job: job.id, row: b.row })[0]
      if (!row) throw new ApiError(404, 'Ligne introuvable.')
      if (b.values !== undefined) {
        if (!b.values || Array.isArray(b.values) || Object.keys(b.values).some((key) => key === 'external_id' || !Object.hasOwn(adapter().fields[job.getString('type')], key) || typeof b.values[key] !== 'string' || b.values[key].length > (key === 'image_base64' ? 200000 : 10000))) throw new BadRequestError('Corrections invalides.')
        const staged = json(row, 'normalized_data'); row.set('normalized_data', { input: { ...staged.input, ...b.values } })
      }
      row.set('resolution', b.resolution); const patches = evaluateChange(app, job, row); result = e.request.header.get('X-Horizon-Import-Response') === 'changes' ? { ...dto(app, job, patches), partial: true } : dto(app, job)
    })
    return e.json(200, result)
  },
  resolveBulk(e) {
    const user = guard(e), b = e.requestInfo().body; exact(b, ['filter', 'resolution'])
    if (!['all', 'create', 'update', 'conflict', 'error', 'skip'].includes(b.filter) || !['', 'skip'].includes(b.resolution)) throw new BadRequestError('Décision groupée invalide.')
    let result
    e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth }); const job = owned(app, user, e.request.pathValue('id'))
      if (job.getString('status') !== 'preview') throw new ApiError(409, 'Les décisions sont verrouillées après le début de l’import.')
      for (const row of rows(app, job)) if (b.filter === 'all' || row.getString('status') === b.filter || json(row, 'normalized_data').plan?.status === b.filter) { row.set('resolution', b.resolution); app.save(row) }
      evaluate(app, job); result = dto(app, job)
    })
    return e.json(200, result)
  },
  recheck(e) {
    const user = guard(e); exact(e.requestInfo().body, [])
    let result
    e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth }); const source = owned(app, user, e.request.pathValue('id'))
      if (!['preview', 'blocked'].includes(source.getString('status'))) throw new ApiError(409, 'Seule une préparation en attente ou bloquée peut être revérifiée.')
      const staged = rows(app, source), applied = staged.filter((row) => row.getString('status') === 'applied').length
      let job = source
      if (applied || source.getString('started_at')) {
        const key = 'recheck-' + source.id
        const existing = app.findRecordsByFilter('core_import_jobs', 'created_by = {:user} && creation_key = {:key}', '', 1, 0, { user: user.id, key })[0]
        if (existing) { result = dto(app, existing); return }
        const pending = staged.filter((row) => row.getString('status') !== 'applied')
        if (!pending.length) throw new ApiError(409, 'Toutes les lignes ont déjà été traitées.')
        job = new Record(app.findCollectionByNameOrId('core_import_jobs'))
        for (const key of ['type', 'source', 'namespace', 'mode']) job.set(key, source.getString(key))
        job.set('filename', ('Reprise · ' + source.getString('filename')).slice(0, 255)); job.set('mapping', json(source, 'mapping')); job.set('created_by', user.id); job.set('creation_key', key); job.set('status', 'preview'); app.save(job)
        for (const original of pending) {
          const row = new Record(app.findCollectionByNameOrId('core_import_rows'))
          row.set('job', job.id); row.set('row_number', original.getInt('row_number')); row.set('source_key', original.getString('source_key')); row.set('resolution', original.getString('resolution')); row.set('normalized_data', { input: json(original, 'normalized_data').input }); row.set('status', 'error'); app.save(row)
        }
        require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_import_jobs', job.id, user.id, null, { source_job: source.id, remaining: pending.length, applied }, 'recheck')
      }
      job.set('status', 'preview'); job.set('error', ''); evaluate(app, job); result = dto(app, job)
    })
    return e.json(200, result)
  },
  discard(e) {
    const user = guard(e); exact(e.requestInfo().body, [])
    let result
    e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth }); const job = owned(app, user, e.request.pathValue('id'))
      if (job.getString('archived_at')) { result = { deleted: false, archived: true }; return }
      if (!['preview', 'blocked', 'applying'].includes(job.getString('status'))) throw new ApiError(409, 'Un import terminé ne peut pas être retiré de l’historique.')
      const staged = rows(app, job), applied = staged.filter((row) => row.getString('status') === 'applied').length
      const before = { type: job.getString('type'), filename: job.getString('filename'), status: job.getString('status'), rows: staged.length, applied }
      if (job.getString('started_at') || applied) {
        job.set('status', 'cancelled'); job.set('archived_at', new Date().toISOString()); app.save(job)
        require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_import_jobs', job.id, user.id, before, { status: 'cancelled', archived_at: job.getString('archived_at'), applied }, 'archive')
        result = { deleted: false, archived: true }
      } else {
        for (const row of staged) app.delete(row)
        app.delete(job)
        require(`${__hooks}/lib/access-policy.js`).audit(app, 'core_import_jobs', job.id, user.id, before, null, 'discard')
        result = { deleted: true, archived: false }
      }
    })
    return e.json(200, result)
  },
  apply(e) {
    const user = guard(e), id = e.request.pathValue('id'); exact(e.requestInfo().body, [])
    let result, failedRow = '', failedNumber = 0, failedMessage = '', alreadyStarted = false
    const checkRow = (row, action) => {
      try { return action() } catch (error) {
        failedRow = row.id; failedNumber = row.getInt('row_number')
        failedMessage = error.status === 400 ? error.message : adapter().validationMessage(error)
        if (error.status && error.status !== 400) throw error
        if (error.status !== 400 && !adapter().validationFields(error).length) throw new ApiError(500, `Ligne ${failedNumber} : enregistrement impossible. Consultez les journaux PocketBase.`)
        throw new BadRequestError(`Ligne ${failedNumber} : ${failedMessage}${alreadyStarted ? ' Préparez une nouvelle simulation ; les lignes déjà importées sont conservées.' : ''}`)
      }
    }
    try { e.app.runInTransaction((app) => {
      guard({ app, auth: e.auth }); const job = owned(app, user, id), status = job.getString('status')
      if (status === 'completed') { result = dto(app, job); return }
      if (!['preview', 'applying'].includes(status)) throw new ApiError(409, 'Cet import est bloqué. Préparez une nouvelle simulation avec le fichier source.')
      alreadyStarted = status === 'applying'
      const pending = rows(app, job).filter((r) => r.getString('status') !== 'applied')
      if (pending.some((r) => ['conflict', 'error'].includes(r.getString('status')))) throw new BadRequestError('Résolvez ou ignorez les lignes en erreur avant de confirmer.')
      // Recheck every staged target before starting, and again per batch/row.
      const check = status === 'preview' ? pending : pending.slice(0, 25)
      for (const row of check) if (row.getString('status') !== 'skip' || row.getString('matched_record_id')) {
        const plan = checkRow(row, () => adapter().plan(app, job.getString('type'), json(row, 'normalized_data').input, job.getString('namespace'), row.getString('source_key'), job.getString('mode'), row.getString('resolution')))
        const difference = require(`${__hooks}/lib/import-comparison.js`)({ status: row.getString('status'), record_id: row.getString('matched_record_id'), fingerprint: row.getString('fingerprint'), before: json(row, 'before') }, plan)
        if (difference) {
          failedRow = row.id; failedNumber = row.getInt('row_number')
          app.logger().warn('Import preparation mismatch', 'job_id', job.id, 'row', failedNumber, 'reason', difference.reason, 'changed_fields', JSON.stringify(difference.fields))
          throw new ApiError(409, `Ligne ${failedNumber} : ${difference.message} Utilisez « Revérifier la préparation » avant de confirmer de nouveau.`)
        }
      }
      job.set('status', 'applying'); if (!job.getString('started_at')) job.set('started_at', new Date().toISOString()); app.save(job)
      for (const row of pending.slice(0, 25)) {
        if (row.getString('status') !== 'skip') row.set('matched_record_id', checkRow(row, () => adapter().apply(app, user, job, row)))
        else if (row.getString('matched_record_id')) checkRow(row, () => adapter().bind(app, job, row, row.getString('matched_record_id')))
        row.set('status', 'applied'); app.save(row)
      }
      const summary = summarize(app, job)
      if (summary.applied === summary.total) { job.set('status', 'completed'); job.set('completed_at', new Date().toISOString()); app.save(job) }
      result = dto(app, job)
    }) } catch (error) {
      if (failedRow) {
        e.app.logger().error('Import application refused', 'job_id', id, 'row', failedNumber, 'status', error.status || 500)
        if (error.status === 400) e.app.runInTransaction((app) => {
          guard({ app, auth: e.auth }); const job = owned(app, user, id)
          if (job.getString('status') === 'applying') { job.set('status', 'blocked'); job.set('error', error.message); app.save(job); return }
          if (job.getString('status') !== 'preview') return
          const row = app.findRecordById('core_import_rows', failedRow)
          if (row.getString('job') !== job.id || row.getString('status') === 'applied') return
          row.set('status', 'error'); row.set('error', failedMessage); app.save(row); summarize(app, job)
        })
      }
      if (error.status === 409) e.app.runInTransaction((app) => {
        guard({ app, auth: e.auth }); const job = owned(app, user, id)
        if (!job.getString('archived_at') && job.getString('status') !== 'completed') { job.set('status', 'blocked'); job.set('error', failedRow ? error.message : 'Les données ont changé depuis la simulation. Utilisez « Revérifier la préparation » ; les lignes déjà traitées restent conservées.'); app.save(job) }
      })
      throw error
    }
    return e.json(200, result)
  },
  get(e) { const user = guard(e); return e.json(200, dto(e.app, owned(e.app, user, e.request.pathValue('id')))) },
  history(e) {
    const user = guard(e)
    return e.json(200, { items: e.app.findRecordsByFilter('core_import_jobs', 'created_by = {:user} && archived_at = ""', '-created,-id', 30, 0, { user: user.id }).map((r) => ({ id: r.id, type: r.getString('type'), filename: r.getString('filename'), status: r.getString('status'), created: r.getString('created'), summary: json(r, 'summary') })) })
  },
  profiles(e) {
    const user = guard(e)
    if (e.request.method === 'POST') {
      const b = e.requestInfo().body; exact(b, ['name', 'type', 'headers', 'mapping', 'mode'])
      if (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 100 || !Object.hasOwn(adapter().fields, b.type) || !Array.isArray(b.headers) || b.headers.length > 60 || b.headers.some((v) => typeof v !== 'string' || v.length > 160) || !['create', 'update', 'upsert'].includes(b.mode) || !b.mapping || Object.keys(b.mapping).some((k) => !Object.hasOwn(adapter().fields[b.type], k) || !Number.isInteger(b.mapping[k]) || b.mapping[k] < 0 || b.mapping[k] >= b.headers.length)) throw new BadRequestError('Profil invalide.')
      e.app.runInTransaction((app) => {
        if (app.findRecordsByFilter('core_import_profiles', 'owner = {:user} && name = {:name} && type = {:type}', '', 1, 0, { user: user.id, name: b.name.trim(), type: b.type }).length) throw new ApiError(409, 'Un profil porte déjà ce nom. Choisissez un nouveau nom.')
        const r = new Record(app.findCollectionByNameOrId('core_import_profiles')); r.set('owner', user.id); for (const [k, v] of Object.entries(b)) r.set(k, k === 'name' ? v.trim() : v); app.save(r)
      })
    }
    return e.json(200, { items: e.app.findRecordsByFilter('core_import_profiles', 'owner = {:user}', 'name,id', 100, 0, { user: user.id }).map((r) => ({ id: r.id, name: r.getString('name'), type: r.getString('type'), headers: JSON.parse(r.getString('headers') || '[]'), mapping: json(r, 'mapping'), mode: r.getString('mode') })) })
  },
}
