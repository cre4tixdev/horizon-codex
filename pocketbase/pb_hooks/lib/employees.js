const policy = require(`${__hooks}/lib/access-policy.js`)
const fields = ['first_name', 'last_name', 'professional_email', 'professional_phone', 'job_title', 'employment_type', 'team', 'manager', 'is_manager', 'is_direction', 'external_company', 'start_date', 'end_date', 'status']
const identity = (app, record, admin) => {
  const account = app.findRecordsByFilter('core_users', 'employee = {:id}', '', 1, 0, { id: record.id })[0]
  return { ...record.publicExport(), account_id: admin && account ? account.id : '', has_account: Boolean(account), account_active: Boolean(account?.getBool('active')) }
}
const write = (event) => { if (event.auth.getString('erp_profile') === 'viewer' || !policy.permissions(event.app, event.auth).includes('hr.write')) throw new ForbiddenError('Modification des employés non autorisée.') }
const validate = (app, input, current, actor) => {
  if (!input || Object.keys(input).some((key) => !fields.includes(key))) throw new BadRequestError('Champs employé invalides.')
  for (const key of fields.filter((field) => !['is_manager', 'is_direction'].includes(field))) if (typeof input[key] !== 'string') throw new BadRequestError('Fiche employé incomplète.')
  if (!input.first_name.trim() || !input.last_name.trim() || input.first_name.length > 80 || input.last_name.length > 80 || typeof input.is_manager !== 'boolean' || typeof input.is_direction !== 'boolean') throw new BadRequestError('Identité invalide.')
  if (input.is_manager && input.is_direction) throw new BadRequestError('Choisissez une seule responsabilité : Manager ou Direction.')
  const org = policy.permissions(app, actor).includes('hr.organisation.manage')
  for (const key of ['team', 'manager', 'is_manager', 'is_direction', 'status']) if (!org && (!current || input[key] !== (['is_manager', 'is_direction'].includes(key) ? current.getBool(key) : current.getString(key)))) throw new ForbiddenError('Modification de l’organisation non autorisée.')
  if (input.team) { const team = app.findRecordById('core_teams', input.team); if (!team.getBool('active') && (!current || current.getString('team') !== team.id)) throw new BadRequestError('Équipe inactive.') }
  if (input.external_company && input.external_company !== current?.getString('external_company') && !policy.permissions(app, actor).includes('contacts.read')) throw new ForbiddenError('Lecture Contacts nécessaire pour rattacher une société externe.')
  if (input.manager) {
    const manager = app.findRecordById('hr_employees', input.manager)
    if ((!manager.getBool('is_manager') && !manager.getBool('is_direction')) || manager.getString('status') !== 'active') throw new BadRequestError('Choisissez un responsable actif désigné Manager ou Direction.')
    if (input.is_direction && !manager.getBool('is_direction')) throw new BadRequestError('Une Direction peut uniquement être rattachée à une autre Direction.')
    const visited = new Set(current ? [current.id] : [])
    let cursor = manager
    while (cursor) { if (visited.has(cursor.id)) throw new BadRequestError('Cycle hiérarchique interdit.'); visited.add(cursor.id); cursor = cursor.getString('manager') ? app.findRecordById('hr_employees', cursor.getString('manager')) : null }
  }
  if (current && ((!input.is_manager && !input.is_direction) || input.status !== 'active') && app.findRecordsByFilter('hr_employees', 'manager = {:id} && status = "active"', '', 1, 0, { id: current.id }).length) throw new BadRequestError('Réaffectez les collaborateurs actifs avant de retirer ce responsable.')
  if (current && !input.is_direction && app.findRecordsByFilter('hr_employees', 'manager = {:id} && is_direction = true', '', 1, 0, { id: current.id }).length) throw new BadRequestError('Réaffectez les directions rattachées avant de retirer cette responsabilité.')
  if (current && ((!input.is_manager && !input.is_direction) || input.status !== 'active') && app.findAllRecords('core_teams').some((team) => team.getBool('active') && Array.from(team.getStringSlice('managers')).includes(current.id))) throw new BadRequestError('Retirez cette personne des managers des équipes actives avant de modifier sa responsabilité ou son statut.')
  for (const key of ['start_date', 'end_date']) if (input[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(input[key]) || !Number.isFinite(Date.parse(input[key])) || new Date(input[key]).toISOString().slice(0, 10) !== input[key])) throw new BadRequestError('Date invalide.')
  if (input.start_date && input.end_date && input.end_date < input.start_date) throw new BadRequestError('La date de fin précède la date de début.')
}
module.exports = {
  directory(event) {
    if (!policy.permissions(event.app, event.auth).includes('hr.read')) throw new ForbiddenError('Consultation des employés non autorisée.')
    const admin = policy.admin(event.app, event.auth)
    const employees = event.app.findAllRecords('hr_employees').filter((record) => policy.hrAllowed(event.app, event.auth, record)).map((record) => identity(event.app, record, admin))
    return event.json(200, { employees, teams: event.app.findAllRecords('core_teams').map((record) => record.publicExport()), can_manage_teams: policy.settings(event.app, event.auth) })
  },
  save(event) {
    write(event)
    const body = event.requestInfo().body
    if (!body || Object.keys(body).some((key) => !['id', 'updated', 'input', 'remove_avatar'].includes(key))) throw new BadRequestError('Requête invalide.')
    const input = typeof body.input === 'string' ? JSON.parse(body.input) : body.input
    let files = []
    if (event.request.header.get('Content-Type').startsWith('multipart/form-data')) {
      try { files = event.findUploadedFiles('avatar') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error }
    }
    if (files.length > 1) throw new BadRequestError('Une seule photo est autorisée.')
    let saved
    event.app.runInTransaction((app) => {
      const actor = app.findRecordById('core_users', event.auth.id)
      const record = body.id ? app.findRecordById('hr_employees', body.id) : new Record(app.findCollectionByNameOrId('hr_employees'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'La fiche a changé. Actualisez-la.')
      validate(app, input, body.id ? record : null, actor)
      const before = body.id ? record.publicExport() : null
      if (body.id && !policy.hrAllowed(app, actor, record, true)) throw new ForbiddenError('Employé hors de votre périmètre.')
      for (const key of fields) record.set(key, input[key])
      if (body.remove_avatar === true || body.remove_avatar === 'true') record.set('avatar', '')
      if (files.length) record.set('avatar', files)
      if (!policy.hrAllowed(app, actor, record, true)) throw new ForbiddenError('Destination hors de votre périmètre.')
      if (['inactive', 'ended'].includes(input.status)) {
        const account = app.findRecordsByFilter('core_users', 'employee = {:id}', '', 1, 0, { id: record.id })[0]
        if (account?.getBool('active')) {
          if (account.getString('erp_profile') === 'admin' && app.findRecordsByFilter('core_users', 'erp_profile = "admin" && active = true && role.active = true && id != {:id}', '', 1, 0, { id: account.id }).length === 0) throw new BadRequestError('Le dernier Admin actif doit être conservé.')
          const previous = { active: true }; account.set('active', false); app.save(account); policy.audit(app, 'core_users', account.id, actor.id, previous, { active: false }, 'disable')
        }
      }
      app.save(record); saved = identity(app, record, policy.admin(app, actor)); policy.audit(app, 'hr_employees', record.id, actor.id, before, record.publicExport(), body.id ? before.active && !body.active ? 'archive' : !before.active && body.active ? 'restore' : 'update' : 'create')
    })
    return event.json(200, saved)
  },
  team(event) {
    if (!policy.settings(event.app, event.auth)) throw new ForbiddenError('Gestion des équipes réservée à Admin et Superuser.')
    const body = event.requestInfo().body
    if (!body || Object.keys(body).some((key) => !['id', 'updated', 'name', 'active', 'managers'].includes(key)) || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.active !== 'boolean' || !Array.isArray(body.managers) || body.managers.length > 100 || body.managers.some((id) => typeof id !== 'string' || !id) || new Set(body.managers).size !== body.managers.length) throw new BadRequestError('Équipe invalide.')
    let result
    event.app.runInTransaction((app) => {
      const record = body.id ? app.findRecordById('core_teams', body.id) : new Record(app.findCollectionByNameOrId('core_teams'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'L’équipe a changé. Actualisez la liste.')
      const previousManagers = Array.from(record.getStringSlice('managers'))
      for (const id of body.managers) {
        const manager = app.findRecordById('hr_employees', id)
        if (!previousManagers.includes(id) && !policy.hrAllowed(app, event.auth, manager)) throw new ForbiddenError('Manager hors de votre périmètre.')
        if (body.active && (manager.getString('status') !== 'active' || (!manager.getBool('is_manager') && !manager.getBool('is_direction')))) throw new BadRequestError('Les managers d’une équipe active doivent être actifs et désignés Manager ou Direction.')
        if (!body.active && !previousManagers.includes(id) && (manager.getString('status') !== 'active' || (!manager.getBool('is_manager') && !manager.getBool('is_direction')))) throw new BadRequestError('Choisissez un Manager ou une Direction active.')
      }
      const before = body.id ? record.publicExport() : null
      if (!body.id) { record.id = $security.randomString(15).toLowerCase(); record.set('code', record.id) }
      record.set('name', body.name.trim()); record.set('active', body.active); record.set('managers', body.managers)
      app.save(record); result = record.publicExport(); policy.audit(app, 'core_teams', record.id, event.auth.id, before, result, body.id ? 'update' : 'create')
    })
    return event.json(200, result)
  },
}
