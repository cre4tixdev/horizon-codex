const policy = require(`${__hooks}/lib/access-policy.js`)
const userExport = (app, user) => {
  let employee = null
  if (user.getString('employee')) { const item = app.findRecordById('hr_employees', user.getString('employee')); employee = { id: item.id, name: `${item.getString('first_name')} ${item.getString('last_name')}`, is_manager: item.getBool('is_manager'), is_direction: item.getBool('is_direction') } }
  return { id: user.id, email: user.email(), name: user.getString('name'), active: user.getBool('active'), erp_profile: user.getString('erp_profile') || 'user', employee: user.getString('employee'), employee_identity: employee, updated: user.getString('updated'), grants: policy.grantsFor(app, user) }
}
const authorize = (event) => { if (!policy.admin(event.app, event.auth)) throw new ForbiddenError('Gestion des utilisateurs réservée à un Admin.') }
module.exports = {
  list(event) {
    authorize(event)
    return event.json(200, { users: event.app.findAllRecords('core_users').map((user) => userExport(event.app, user)), modules: policy.modules, employees: event.app.findAllRecords('hr_employees').map((item) => ({ id: item.id, name: `${item.getString('first_name')} ${item.getString('last_name')}`, status: item.getString('status') })) })
  },
  save(event) {
    authorize(event)
    const body = event.requestInfo().body
    if (!body || Object.keys(body).some((key) => !['id', 'updated', 'input'].includes(key))) throw new BadRequestError('Requête invalide.')
    const input = body.input
    if (!input || Object.keys(input).some((key) => !['email', 'name', 'active', 'erp_profile', 'employee', 'grants', 'password'].includes(key))) throw new BadRequestError('Champs utilisateur invalides.')
    if (!['admin', 'superuser', 'user', 'viewer'].includes(input.erp_profile) || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160 || typeof input.email !== 'string' || input.email.length > 254 || typeof input.active !== 'boolean' || typeof input.employee !== 'string') throw new BadRequestError('Identité ou profil invalide.')
    if (input.password && (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 1024)) throw new BadRequestError('Mot de passe : au moins 12 caractères.')
    if (!body.id && !input.password) throw new BadRequestError('Mot de passe initial requis.')
    const rights = policy.validateGrants(input.erp_profile, input.grants)
    if (input.grants.hr?.actions.length && input.grants.hr.scope !== 'all' && !input.employee) throw new BadRequestError('Employé lié requis pour ce périmètre.')
    let saved
    event.app.runInTransaction((app) => {
      if (!policy.admin(app, app.findRecordById('core_users', event.auth.id))) throw new ForbiddenError('Accès administrateur révoqué.')
      const user = body.id ? app.findRecordById('core_users', body.id) : new Record(app.findCollectionByNameOrId('core_users'))
      if (!body.id) user.set('id', $security.randomString(15).toLowerCase())
      if (body.id && user.getString('updated') !== body.updated) throw new ApiError(409, 'Le compte a changé. Actualisez la liste.')
      const before = body.id ? userExport(app, user) : null
      if (body.id && user.getString('erp_profile') === 'admin' && user.getBool('active') && (!input.active || input.erp_profile !== 'admin')) {
        if (app.findRecordsByFilter('core_users', 'erp_profile = "admin" && active = true && role.active = true && id != {:id}', '', 1, 0, { id: user.id }).length === 0) throw new BadRequestError('Le dernier Admin actif doit être conservé.')
      }
      if (input.employee) {
        const employee = app.findRecordById('hr_employees', input.employee)
        if (input.active && ['inactive', 'ended'].includes(employee.getString('status'))) throw new BadRequestError('Cette ressource est inactive.')
        if (app.findRecordsByFilter('core_users', 'employee = {:employee} && id != {:id}', '', 1, 0, { employee: input.employee, id: user.id }).length) throw new BadRequestError('Employé déjà rattaché à un autre compte.')
        if (input.erp_profile !== 'admin' && input.grants.hr?.actions.length && input.grants.hr.scope === 'reports' && !employee.getBool('is_manager') && !employee.getBool('is_direction')) throw new BadRequestError('Responsabilité de Manager ou Direction nécessaire pour le périmètre collaborateurs.')
        if (input.erp_profile !== 'admin' && input.grants.hr?.actions.length && input.grants.hr.scope === 'team' && !employee.getString('team')) throw new BadRequestError('Équipe nécessaire pour ce périmètre.')
      }
      const roleName = `access_${user.id}`
      const role = app.findRecordsByFilter('core_roles', 'name = {:name}', '', 1, 0, { name: roleName })[0] || new Record(app.findCollectionByNameOrId('core_roles'))
      role.set('name', roleName); role.set('label', { admin: 'Admin', superuser: 'Superuser', user: 'User', viewer: 'Viewer' }[input.erp_profile]); role.set('active', true); role.set('permissions', rights); app.save(role)
      user.set('role', role.id); user.set('erp_profile', input.erp_profile); user.set('access_grants', input.grants); user.set('hr_scope', input.erp_profile === 'admin' ? 'all' : input.grants.hr?.scope || 'none')
      for (const key of ['email', 'name', 'active', 'employee']) user.set(key, input[key])
      if (input.password) user.setPassword(input.password)
      app.save(user); saved = userExport(app, user)
      policy.audit(app, 'core_users', user.id, event.auth.id, before, saved, body.id ? 'update' : 'create')
    })
    return event.json(200, saved)
  },
}
