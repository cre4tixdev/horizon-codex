const policy = require(`${__hooks}/lib/access-policy.js`)
const common = require(`${__hooks}/lib/purchasing-common.js`)
const guard = (app, user, write = false) => {
  const rights = policy.permissions(app, user)
  if (!rights.includes('calendar.read') || write && (!rights.includes('calendar.write') || user.getString('erp_profile') === 'viewer')) throw new ForbiddenError('Accès aux événements manuels refusé.')
}
const dto = (app, user, record) => ({ ...record.publicExport(), editable: record.getString('owner') === user.id && user.getString('erp_profile') !== 'viewer' && policy.permissions(app, user).includes('calendar.write') })
const accessible = (app, user, id, write = false) => {
  guard(app, user, write)
  const record = common.get(app, 'calendar_events', id)
  if (record.getString('owner') !== user.id && (write || record.getString('visibility') !== 'team')) throw new ApiError(404, 'Événement introuvable.')
  if (record.getBool('archived')) throw new ApiError(404, 'Événement retiré du calendrier.')
  return record
}
const read = (event) => event.json(200, dto(event.app, event.auth, accessible(event.app, event.auth, event.request.pathValue('id'))))
const save = (event) => {
  guard(event.app, event.auth, true)
  const body = event.requestInfo().body
  common.exact(body, ['id', 'input', 'creation_key', 'updated'])
  common.exact(body.input, ['title', 'description', 'start', 'end', 'all_day', 'timezone', 'location', 'visibility', 'tone', 'color'])
  const input = body.input, dates = require(`${__hooks}/lib/tenders.js`)
  const start = dates.date(input.start, true), end = dates.date(input.end || '', false)
  if (input.all_day && end) throw new BadRequestError('Une journée entière ne nécessite pas de date de fin.')
  if (end && Date.parse(end) <= Date.parse(start)) throw new BadRequestError('La fin doit être après le début.')
  if (typeof input.all_day !== 'boolean' || !['private', 'team'].includes(input.visibility) || !['blue', 'violet', 'pink', 'green', 'amber', 'navy'].includes(input.tone) || input.color && !/^#[0-9a-fA-F]{6}$/.test(input.color)) throw new BadRequestError('Vérifiez la visibilité et la couleur.')
  if (!['Europe/Paris', 'Europe/London', 'UTC', 'America/New_York', 'Asia/Dubai'].includes(input.timezone)) throw new BadRequestError('Fuseau horaire invalide.')
  const values = { title: common.text(input.title, 200, true), description: common.text(input.description, 5000), location: common.text(input.location, 500), start, end, all_day: input.all_day, timezone: input.timezone, visibility: input.visibility, tone: input.tone, color: common.text(input.color, 7) }
  const key = common.text(body.creation_key || '', 100, !body.id)
  let result
  event.app.runInTransaction((app) => {
    const existing = body.id ? accessible(app, event.auth, body.id, true) : app.findRecordsByFilter('calendar_events', 'owner = {:owner} && creation_key = {:key}', '', 1, 0, { owner: event.auth.id, key })[0]
    if (!body.id && existing) {
      const identical = Object.entries(values).every(([field, value]) => field === 'start' || field === 'end' ? (existing.getString(field) ? new Date(existing.getString(field)).toISOString() : '') === value : existing.get(field) === value)
      if (!identical || existing.getBool('archived')) throw new ApiError(409, 'Cette création existe déjà avec un autre contenu.')
      result = dto(app, event.auth, existing); return
    }
    if (existing && existing.getString('updated') !== body.updated) throw new ApiError(409, 'Cet événement a changé. Fermez puis rouvrez sa fiche.')
    const record = existing || new Record(app.findCollectionByNameOrId('calendar_events')), before = existing ? record.publicExport() : null
    if (!existing) { record.set('owner', event.auth.id); record.set('creation_key', key) }
    for (const [field, value] of Object.entries(values)) record.set(field, value)
    app.save(record); policy.audit(app, 'calendar_events', record.id, event.auth.id, before, record.publicExport(), existing ? 'update' : 'create')
    result = dto(app, event.auth, record)
  })
  return event.json(200, result)
}
const remove = (event) => {
  guard(event.app, event.auth, true)
  const body = event.requestInfo().body; common.exact(body, ['id', 'updated'])
  event.app.runInTransaction((app) => {
    const record = accessible(app, event.auth, body.id, true)
    if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Cet événement a changé. Fermez puis rouvrez sa fiche.')
    const before = record.publicExport(); record.set('archived', true); app.save(record)
    policy.audit(app, 'calendar_events', record.id, event.auth.id, before, record.publicExport(), 'archive')
  })
  return event.json(200, { success: true })
}
const projection = (event, from, to) => {
  const query = event.request.url.query()
  if (!policy.permissions(event.app, event.auth).includes('calendar.read') || query.get('scope') === 'tenders' || query.get('state') === 'archived' || ['company', 'status', 'preparation_status', 'tag'].some((key) => query.get(key))) return []
  const params = { user: event.auth.id, from: from.replace('T', ' '), to: to.replace('T', ' '), owner: query.get('owner'), q: (query.get('q') || '').slice(0, 200) }
  const records = event.app.findRecordsByFilter('calendar_events', 'archived = false && (owner = {:user} || visibility = "team") && start < {:to} && (start >= {:from} || end > {:from})' + (params.owner ? ' && owner = {:owner}' : '') + (params.q ? ' && (title ~ {:q} || description ~ {:q} || location ~ {:q})' : ''), 'start', 2001, 0, params)
  if (records.length > 2000) throw new BadRequestError('Trop d’événements. Réduisez la période.')
  return records.map((record) => ({ id: `calendar:${record.id}`, source_module: 'calendar', source_entity: 'calendar_events', source_record_id: record.id, kind: 'event', title: record.getString('title'), code: '', company: '', start: new Date(record.getString('start')).toISOString(), end: record.getString('end') ? new Date(record.getString('end')).toISOString() : '', all_day: record.getBool('all_day'), timezone: record.getString('timezone'), location: record.getString('location'), tone: record.getString('tone'), color: record.getString('color'), href: `/calendar?event=${record.id}` }))
}
module.exports = { read, save, remove, projection }
