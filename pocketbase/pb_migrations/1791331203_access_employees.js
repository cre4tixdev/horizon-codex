migrate((app) => {
  const users = app.findCollectionByNameOrId('core_users')
  const email = $os.getenv('HORIZON_INITIAL_ADMIN_EMAIL').trim().toLowerCase()
  if (!email && app.findAllRecords(users).length) throw new Error('HORIZON_INITIAL_ADMIN_EMAIL is required when upgrading existing Horizon accounts. No account is promoted automatically.')
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const teams = new Collection({ name: 'core_teams', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [{ name: 'code', type: 'text', max: 35, required: true }, { name: 'name', type: 'text', max: 120, required: true }, { name: 'active', type: 'bool' }, ...dates], indexes: ['CREATE UNIQUE INDEX idx_team_code ON core_teams (code)'] })
  app.save(teams)
  const employees = new Collection({ name: 'hr_employees', type: 'base', createRule: null, updateRule: null, deleteRule: null, fields: [
    ...['first_name', 'last_name'].map((name) => ({ name, type: 'text', max: 80, required: true })), { name: 'professional_email', type: 'email' }, { name: 'professional_phone', type: 'text', max: 40 }, { name: 'job_title', type: 'text', max: 120 },
    { name: 'employment_type', type: 'select', values: ['employee', 'freelance', 'interim', 'external'], maxSelect: 1, required: true }, { name: 'team', type: 'relation', collectionId: teams.id, maxSelect: 1 }, { name: 'is_manager', type: 'bool' },
    { name: 'external_company', type: 'relation', collectionId: app.findCollectionByNameOrId('contacts_companies').id, maxSelect: 1 }, { name: 'start_date', type: 'date' }, { name: 'end_date', type: 'date' },
    { name: 'status', type: 'select', values: ['active', 'inactive', 'planned', 'ended'], maxSelect: 1, required: true }, { name: 'avatar', type: 'file', protected: true, maxSelect: 1, maxSize: 2097152, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] }, ...dates,
  ] })
  app.save(employees)
  employees.fields.add(new RelationField({ name: 'manager', collectionId: employees.id, maxSelect: 1, cascadeDelete: false }))
  app.save(employees)
  users.fields.add(new SelectField({ name: 'erp_profile', values: ['admin', 'superuser', 'user', 'viewer'], maxSelect: 1 }))
  users.fields.add(new JSONField({ name: 'access_grants', maxSize: 20000, hidden: true }))
  users.fields.add(new SelectField({ name: 'hr_scope', values: ['none', 'self', 'reports', 'team', 'all'], maxSelect: 1 }))
  users.fields.add(new RelationField({ name: 'employee', collectionId: employees.id, maxSelect: 1, cascadeDelete: false }))
  users.indexes.push("CREATE UNIQUE INDEX idx_user_employee ON core_users (employee) WHERE employee != ''")
  app.save(users)
  for (const user of app.findAllRecords(users)) { user.set('erp_profile', 'user'); user.set('hr_scope', 'none'); user.set('access_grants', {}); app.save(user) }
  users.fields.getByName('erp_profile').required = true
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  users.listRule = `${auth} && (id = @request.auth.id || @request.auth.erp_profile = "admin")`; users.viewRule = users.listRule
  app.save(users)
  const roles = app.findCollectionByNameOrId('core_roles')
  roles.listRule = `${auth} && (id = @request.auth.role || @request.auth.erp_profile = "admin")`; roles.viewRule = roles.listRule; app.save(roles)
  const hr = `${auth} && @request.auth.role.permissions ~ '"hr.read"' && (@request.auth.hr_scope = "all" || (id = @request.auth.employee && @request.auth.hr_scope = "self") || (@request.auth.employee != "" && manager = @request.auth.employee && @request.auth.hr_scope = "reports") || (@request.auth.employee.team != "" && team = @request.auth.employee.team && @request.auth.hr_scope = "team"))`
  employees.listRule = hr; employees.viewRule = hr; app.save(employees)
  teams.listRule = `${auth} && (@request.auth.role.permissions ~ '"hr.read"' || @request.auth.erp_profile = "admin" || @request.auth.erp_profile = "superuser")`; teams.viewRule = teams.listRule; app.save(teams)
  for (const name of ['settings_countries', 'settings_languages', 'accounting_currencies', 'crm_stages', 'crm_market_types', 'settings_crm', 'settings_numbering_sequences']) {
    const collection = app.findCollectionByNameOrId(name)
    for (const key of ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']) if (collection[key] != null && String(collection[key]).includes('settings.references')) collection[key] = String(collection[key]).replace(/@request.auth.role.permissions ~ '"settings.references"'/g, `(@request.auth.role.permissions ~ '"settings.references"' && (@request.auth.erp_profile = "admin" || @request.auth.erp_profile = "superuser"))`)
    app.save(collection)
  }
  if (email) {
    const user = app.findFirstRecordByFilter(users, 'email = {:email} && active = true', { email })
    const role = new Record(roles)
    role.set('name', `access_${user.id}`); role.set('label', 'Admin'); role.set('active', true)
    role.set('permissions', ['contacts.read', 'contacts.write', 'crm.read', 'crm.write', 'hr.read', 'hr.write', 'hr.organisation.manage', 'settings.references', 'settings.users', 'settings.roles', 'core.views.manage']); app.save(role)
    user.set('role', role.id); user.set('erp_profile', 'admin'); user.set('hr_scope', 'all'); app.save(user)
  }
  // Viewer protection also applies to existing business APIs, regardless of role JSON.
  for (const name of ['contacts_companies', 'contacts_people', 'contacts_addresses', 'contacts_company_roles', 'accounting_third_party_accounts', 'core_activity_events', 'core_tasks']) {
    const collection = app.findCollectionByNameOrId(name)
    for (const key of ['createRule', 'updateRule', 'deleteRule']) if (collection[key] != null) collection[key] = `(${collection[key]}) && @request.auth.erp_profile != "viewer"`
    app.save(collection)
  }
}, () => { throw new Error('Access / employees rollback refused: preserve users and organisation.') })
