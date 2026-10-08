const modules = [
  { key: 'contacts', label: 'Contacts', available: true, actions: ['read', 'write'], scopes: ['all'] },
  { key: 'crm', label: 'CRM', available: true, actions: ['read', 'write'], scopes: ['all'] },
  { key: 'sales', label: 'Ventes', available: true, actions: ['read', 'write'], scopes: ['all'] },
  { key: 'hr', label: 'Employés', available: true, actions: ['read', 'write', 'organisation.manage'], scopes: ['self', 'reports', 'team', 'all'] },
  ...[['purchasing', 'Achats'], ['inventory', 'Stock'], ['projects', 'Projets'], ['planning', 'Planning'], ['time', 'TimeReport'], ['leave', 'Congés'], ['expenses', 'Dépenses'], ['billing', 'Facturation'], ['accounting', 'Comptabilité'], ['service', 'SAV'], ['messaging', 'Messagerie'], ['documents', 'Documents']].map(([key, label]) => ({ key, label, available: false, actions: [], scopes: [] })),
]
const permissions = (app, user) => {
  if (!user || user.collection().name !== 'core_users' || !user.getBool('active')) return []
  const role = app.findRecordById('core_roles', user.getString('role'))
  return role.getBool('active') ? JSON.parse(role.getString('permissions') || '[]') : []
}
const admin = (app, user) => Boolean(user && user.collection().name === 'core_users' && user.getBool('active') && user.getString('erp_profile') === 'admin' && app.findRecordById('core_roles', user.getString('role')).getBool('active'))
const settings = (app, user) => ['admin', 'superuser'].includes(user?.getString('erp_profile')) && permissions(app, user).includes('settings.references')
const hrAllowed = (app, user, record, write = false) => {
  const rights = permissions(app, user)
  if (!rights.includes('hr.read') || write && (user.getString('erp_profile') === 'viewer' || !rights.includes('hr.write'))) return false
  const scope = user.getString('hr_scope'); const own = user.getString('employee')
  if (scope === 'all') return true
  if (!own) return false
  if (scope === 'self') return record.id === own
  if (scope === 'reports') return record.getString('manager') === own
  const employee = app.findRecordById('hr_employees', own)
  return scope === 'team' && Boolean(employee.getString('team')) && employee.getString('team') === record.getString('team')
}
const grantsFor = (app, user) => {
  const stored = JSON.parse(user.getString('access_grants') || '{}') || {}
  if (Object.keys(stored).length) return stored
  const rights = permissions(app, user); const result = {}
  for (const module of modules.filter((item) => item.available)) {
    const actions = module.actions.filter((action) => rights.includes(`${module.key}.${action}`))
    if (actions.length) result[module.key] = { actions, scope: module.key === 'hr' ? user.getString('hr_scope') || 'all' : 'all' }
  }
  return result
}
const validateGrants = (profile, grants) => {
  if (!grants || Array.isArray(grants) || typeof grants !== 'object' || Object.keys(grants).length > modules.length) throw new BadRequestError('Accréditations invalides.')
  const rights = new Set()
  for (const [key, grant] of Object.entries(grants)) {
    const module = modules.find((item) => item.key === key && item.available)
    if (!module || !grant || Object.keys(grant).some((field) => !['actions', 'scope'].includes(field)) || !module.scopes.includes(grant.scope) || !Array.isArray(grant.actions) || new Set(grant.actions).size !== grant.actions.length || grant.actions.some((action) => !module.actions.includes(action))) throw new BadRequestError('Module, action ou périmètre invalide.')
    if (grant.actions.length && !grant.actions.includes('read')) throw new BadRequestError('La consultation est nécessaire avant les autres actions.')
    if (profile === 'viewer' && grant.actions.some((action) => action !== 'read')) throw new BadRequestError('Viewer dispose uniquement de la consultation.')
    if (key === 'hr' && grant.actions.includes('organisation.manage') && grant.scope !== 'all') throw new BadRequestError('La gestion de hiérarchie nécessite le périmètre global Employés.')
    if (key === 'hr' && grant.actions.includes('organisation.manage') && !grant.actions.includes('write')) throw new BadRequestError('La gestion de hiérarchie nécessite la contribution Employés.')
    for (const action of grant.actions) rights.add(`${key}.${action}`)
  }
  if (['admin', 'superuser'].includes(profile)) { rights.add('settings.references'); rights.add('documents.template.manage') }
  if (profile === 'admin') { for (const module of modules.filter((item) => item.available)) for (const action of module.actions) rights.add(`${module.key}.${action}`); for (const right of ['settings.users', 'settings.roles', 'core.views.manage']) rights.add(right) }
  return [...rights]
}
const audit = (app, entity, id, actor, before, after, action) => {
  const record = new Record(app.findCollectionByNameOrId('core_audit'))
  for (const [key, value] of Object.entries({ user: actor, module: entity.startsWith('hr_') ? 'hr' : entity.startsWith('documents_') ? 'documents' : 'core', entity, entity_id: id, action, before, after, metadata: { source: 'server' } })) record.set(key, value)
  app.save(record)
}
module.exports = { modules, permissions, admin, settings, hrAllowed, grantsFor, validateGrants, audit }
