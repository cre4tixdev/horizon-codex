const zones = ['Europe/Paris', 'UTC', 'Europe/London', 'America/New_York', 'America/Montreal', 'Asia/Dubai', 'Asia/Tokyo', 'Africa/Casablanca']
const identifier = (value) => typeof value === 'string' && /^[a-z0-9]{15}$/.test(value)
const date = (value, required = false) => {
  if (!value && !required) return ''
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new BadRequestError('Date et heure invalides.')
  return value
}
const string = (value, max) => { if (typeof value !== 'string' || value.length > max) throw new BadRequestError('Texte AO invalide.'); return value.trim() }
const zone = (value) => { if (!zones.includes(value)) throw new BadRequestError('Fuseau horaire invalide.'); return value }
const authorize = (event, write = true) => { if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, write, 'crm')) throw new ForbiddenError('Accès CRM refusé.') }
const root = (app, id, write = true) => {
  if (!identifier(id)) throw new BadRequestError('Dossier AO invalide.')
  let tender
  try { tender = app.findRecordById('crm_tenders', id) } catch { throw new ApiError(404, 'Dossier AO introuvable.') }
  const opportunity = tender.getString('opportunity') ? app.findRecordById('crm_opportunities', tender.getString('opportunity')) : tender
  if ((tender.getString('opportunity') && opportunity.getString('type') !== 'tender' || tender.getString('archived_at')) || write && (!tender.getBool('active') || !opportunity.getBool('active'))) throw new BadRequestError('Ce dossier AO est archivé ou invalide.')
  return { tender, opportunity }
}
const log = (app, opportunity, record, before, actor, action, message) => {
  const entry = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor, module: 'crm', entity: record.collection().name, entity_id: record.id, action, before, after: record.publicExport(), metadata: { opportunity: opportunity.id, source: 'server' } })) entry.set(key, value)
  app.save(entry)
  require(`${__hooks}/lib/activity.js`).publish(app, opportunity, actor, 'change', message, { action: 'tender_update' })
}
const find = (app, opportunity) => app.findRecordsByFilter('crm_tenders', 'opportunity = {:id}', '', 1, 0, { id: opportunity })[0]
const validateInput = (app, input, before) => {
  const fields = ['reference', 'consultation_url', 'status', 'publication_date', 'submission_deadline', 'timezone', 'expected_result_date', 'visit_required', 'tags']
  if (!input || Array.isArray(input) || Object.keys(input).some((key) => !fields.includes(key))) throw new BadRequestError('Données AO invalides.')
  const parsed = { reference: string(input.reference, 160), consultation_url: string(input.consultation_url, 1000), timezone: zone(input.timezone), visit_required: input.visit_required, status: input.status, tags: input.tags || [] }
  if (typeof parsed.visit_required !== 'boolean' || parsed.consultation_url && !/^https?:\/\/[^\s]+$/i.test(parsed.consultation_url)) throw new BadRequestError('Lien de consultation ou visite invalide.')
  for (const field of ['publication_date', 'submission_deadline', 'expected_result_date']) parsed[field] = date(input[field])
  let stage
  try { stage = app.findRecordById('crm_tender_statuses', input.status) } catch { throw new BadRequestError('Choisissez une étape de préparation AO.') }
  if (!stage.getBool('active') && (!before || before.status !== input.status)) throw new BadRequestError('Étape AO inactive.')
  if (!Array.isArray(parsed.tags) || parsed.tags.length > 50 || new Set(parsed.tags).size !== parsed.tags.length) throw new BadRequestError('Tags AO invalides.')
  for (const id of parsed.tags) { if (!identifier(id)) throw new BadRequestError('Tag AO invalide.'); const tag = app.findRecordById('crm_tender_tags', id); if (!tag.getBool('active') && !(before?.tags || []).includes(id)) throw new BadRequestError('Tag AO inactif.') }
  if (parsed.publication_date && parsed.submission_deadline && parsed.publication_date > parsed.submission_deadline) throw new BadRequestError('La remise doit suivre la publication.')
  return parsed
}
module.exports = {
  find, date, zone, validateInput, log,
  archive(app, opportunity, actor, expected) {
    const record = find(app, opportunity.id)
    if (!record) throw new BadRequestError('Dossier AO introuvable.')
    if (expected !== record.getString('updated')) throw new ApiError(409, 'Le dossier AO a été modifié. Rechargez la fiche.')
    const before = record.publicExport()
    record.set('archived_at', new Date().toISOString())
    app.save(record)
    log(app, opportunity, record, before, actor, 'archive', 'Dossier AO archivé · opportunité convertie en directe')
    return record
  },
  save(app, opportunity, input, actor, expected) {
    let record = find(app, opportunity.id)
    const before = record ? record.publicExport() : null
    if (record && expected !== record.getString('updated')) throw new ApiError(409, 'Le dossier AO a été modifié. Rechargez la fiche.')
    const parsed = validateInput(app, input, before)
    if (!record) { record = new Record(app.findCollectionByNameOrId('crm_tenders')); record.set('opportunity', opportunity.id); record.set('active', true) }
    for (const [key, value] of Object.entries(parsed)) record.set(key, value)
    record.set('archived_at', '')
    app.save(record)
    log(app, opportunity, record, before, actor, before?.archived_at ? 'restore' : before ? 'update' : 'create', before?.archived_at ? 'Dossier AO réactivé' : before ? 'Dossier AO mis à jour' : 'Dossier AO créé')
    return record
  },
  same(app, opportunity, input) {
    const record = find(app, opportunity.id)
    if (!record) return false
    const parsed = validateInput(app, input, record.publicExport())
    return Object.entries(parsed).every(([key, value]) => ['publication_date', 'submission_deadline', 'expected_result_date'].includes(key) ? (!record.getString(key) && !value) || new Date(record.getString(key)).toISOString() === value : JSON.stringify(record.publicExport()[key]) === JSON.stringify(value))
  },
  appointments(event) {
    authorize(event)
    const body = event.requestInfo().body
    let result
    event.app.runInTransaction((app) => {
      const { tender, opportunity } = root(app, body.tender)
      const input = body.input
      if (!input || Object.keys(input).some((key) => !['kind', 'start', 'end', 'timezone', 'location', 'notes', 'participants', 'status'].includes(key)) || !['visit', 'hearing'].includes(input.kind) || !['planned', 'done', 'cancelled'].includes(input.status)) throw new BadRequestError('Rendez-vous AO invalide.')
      const parsed = { kind: input.kind, start: date(input.start, true), end: date(input.end), timezone: zone(input.timezone), location: string(input.location, 500), notes: string(input.notes, 5000), status: input.status, participants: input.participants || [] }
      if (parsed.end && parsed.end <= parsed.start) throw new BadRequestError('La fin doit suivre le début.')
      if (!Array.isArray(parsed.participants) || parsed.participants.length > 50 || new Set(parsed.participants).size !== parsed.participants.length) throw new BadRequestError('Participants invalides.')
      let record = body.id ? app.findRecordById('crm_tender_appointments', body.id) : null
      if (record && (record.getString('tender') !== tender.id || record.getString('updated') !== body.updated)) throw new ApiError(409, 'Le rendez-vous a changé ou appartient à un autre dossier.')
      const before = record ? record.publicExport() : null
      for (const id of parsed.participants) {
        if (!identifier(id)) throw new BadRequestError('Participant invalide.')
        const employee = app.findRecordById('hr_employees', id)
        if (!(before?.participants || []).includes(id) && (employee.getString('status') !== 'active' || !require(`${__hooks}/lib/access-policy.js`).hrAllowed(app, event.auth, employee))) throw new ForbiddenError('Participant non accessible.')
      }
      if (!record) { record = new Record(app.findCollectionByNameOrId('crm_tender_appointments')); record.set('tender', tender.id) }
      for (const [key, value] of Object.entries(parsed)) record.set(key, value)
      app.save(record); log(app, opportunity, record, before, event.auth.id, before ? 'update' : 'create', `${parsed.kind === 'visit' ? 'Visite' : 'Soutenance'} ${parsed.status === 'cancelled' ? 'annulée' : before ? 'mise à jour' : 'planifiée'}`)
      result = record.publicExport()
    })
    return event.json(200, result)
  },
  move(event) {
    authorize(event); const body = event.requestInfo().body
    event.app.runInTransaction((app) => {
      const { tender, opportunity } = root(app, body.tender)
      if (tender.getString('updated') !== body.updated) throw new ApiError(409, 'Le dossier AO a changé. Rechargez le Kanban.')
      const stage = app.findRecordById('crm_tender_statuses', String(body.status))
      if (!stage.getBool('active')) throw new BadRequestError('Étape AO inactive.')
      const before = tender.publicExport(); tender.set('status', stage.id); app.save(tender)
      require(`${__hooks}/lib/tender-cases.js`).decide(app, tender, event.auth.id)
      log(app, opportunity, tender, before, event.auth.id, 'update', `Préparation AO : ${stage.getString('label')}`)
    })
    return event.json(200, { success: true })
  },
  submit(event) {
    authorize(event); const body = event.requestInfo().body
    let result
    event.app.runInTransaction((app) => {
      const { tender, opportunity } = root(app, body.tender)
      if (!tender.getString('opportunity')) throw new BadRequestError('Décidez de répondre avant d’enregistrer un dépôt.')
      if (typeof body.creation_key !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.creation_key)) throw new BadRequestError('Clé du dépôt manquante.')
      const input = body.input
      if (!input || Object.keys(input).some((key) => !['submitted_at', 'timezone', 'notes', 'documents'].includes(key))) throw new BadRequestError('Dépôt invalide.')
      const parsed = { submitted_at: date(input.submitted_at, true), timezone: zone(input.timezone), notes: string(input.notes, 5000), documents: input.documents }
      if (!Array.isArray(parsed.documents) || !parsed.documents.length || parsed.documents.length > 100 || new Set(parsed.documents.map((file) => `${file.event_id}/${file.filename}`)).size !== parsed.documents.length) throw new BadRequestError('Sélectionnez les pièces déposées et la preuve du dépôt.')
      for (const file of parsed.documents) {
        if (!file || Object.keys(file).some((key) => !['event_id', 'filename'].includes(key)) || !identifier(file.event_id) || typeof file.filename !== 'string') throw new BadRequestError('Pièce déposée invalide.')
        const source = app.findRecordById('core_activity_events', file.event_id)
        if (!(source.getString('source_entity') === 'crm_tenders' && source.getString('source_record_id') === tender.id || source.getString('source_entity') === 'crm_opportunities' && source.getString('source_record_id') === tender.getString('opportunity')) || !source.getStringSlice('attachments').includes(file.filename)) throw new BadRequestError('La pièce doit appartenir à cette opportunité.')
      }
      const existing = app.findRecordsByFilter('crm_tender_submissions', 'creation_key = {:key}', '', 1, 0, { key: body.creation_key })[0]
      if (existing) {
        if (existing.getString('tender') !== tender.id || existing.getString('submitted_by') !== event.auth.id || new Date(existing.getString('submitted_at')).toISOString() !== parsed.submitted_at || existing.getString('timezone') !== parsed.timezone || existing.getString('notes') !== parsed.notes || JSON.stringify(JSON.parse(existing.getString('documents') || '[]').map((file) => `${file.event_id}/${file.filename}`).sort()) !== JSON.stringify(parsed.documents.map((file) => `${file.event_id}/${file.filename}`).sort())) throw new ApiError(409, 'Cette clé correspond à un autre dépôt.')
        result = existing.publicExport(); return
      }
      if (new Date(parsed.submitted_at).getTime() > Date.now() + 60000) throw new BadRequestError('Un dépôt effectif ne peut pas être daté dans le futur.')
      const last = app.findRecordsByFilter('crm_tender_submissions', 'tender = {:id}', '-version', 1, 0, { id: tender.id })[0]
      const record = new Record(app.findCollectionByNameOrId('crm_tender_submissions'))
      for (const [key, value] of Object.entries({ ...parsed, tender: tender.id, version: last ? last.getInt('version') + 1 : 1, submitted_by: event.auth.id, creation_key: body.creation_key })) record.set(key, value)
      app.save(record); log(app, opportunity, record, null, event.auth.id, 'create', `Réponse AO déposée · version ${record.getInt('version')}`)
      result = record.publicExport()
    })
    return event.json(200, result)
  },
}
