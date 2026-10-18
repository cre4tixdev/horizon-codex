migrate((app) => {
  const tables = ['time_sheets', 'time_sheet_lines', 'time_entries', 'time_activities', 'time_favorites', 'core_cost_profiles', 'core_resource_profiles']
  if (app.findAllCollections().some((c) => tables.includes(c.name))) throw new Error('TimeReport: examiner les collections existantes avant migration.')
  const text = (name, max = 200) => new TextField({ name, max })
  const rel = (name, table) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(table).id, maxSelect: 1, cascadeDelete: false })
  const num = (name, max = 100000000) => new NumberField({ name, min: 0, max, onlyInt: true })
  const choice = (name, values) => new SelectField({ name, values, maxSelect: 1, required: true })
  const create = (name, fields, indexes = []) => {
    const c = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    for (const f of [...fields, new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) c.fields.add(f)
    c.indexes = indexes; app.save(c)
  }
  create('core_cost_profiles', [text('code'), text('label'), new NumberField({ name: 'hourly_cost', min: 0, max: 100000 }), text('currency', 3), text('effective_from', 10), text('effective_to', 10)], ['CREATE UNIQUE INDEX idx_cost_profile_code ON core_cost_profiles(code)'])
  create('core_resource_profiles', [rel('employee', 'hr_employees'), rel('cost_profile', 'core_cost_profiles'), text('valid_from', 10), text('valid_to', 10), new JSONField({ name: 'weekly_pattern' }), new JSONField({ name: 'work_types' }), new BoolField({ name: 'active' })], ['CREATE INDEX idx_resource_employee_date ON core_resource_profiles(employee,valid_from,valid_to)'])
  const states = ['draft', 'submitted', 'validated', 'rejected']
  create('time_sheets', [rel('employee', 'hr_employees'), rel('user', 'core_users'), rel('manager', 'core_users'), text('week_start', 10), choice('work_type', ['be', 'production']), choice('source_provider', ['horizon', 'onsite']), choice('status', states), num('revision'), text('decision_reason', 2000), ...['submitted_at', 'validated_at'].map((name) => new DateField({ name })), rel('validated_by', 'core_users')], ['CREATE UNIQUE INDEX idx_time_sheet_week ON time_sheets(employee,week_start,work_type,source_provider)', 'CREATE INDEX idx_time_sheet_review ON time_sheets(manager,status,week_start)'])
  create('time_sheet_lines', [rel('sheet', 'time_sheets'), rel('product', 'inventory_products'), rel('analytic_account', 'accounting_analytic_accounts'), rel('sales_order_line', 'sales_order_lines'), choice('context', ['affair', 'presales', 'internal']), num('sort_order'), new JSONField({ name: 'identity_snapshot' })], ['CREATE INDEX idx_time_line_sheet ON time_sheet_lines(sheet,sort_order)'])
  create('time_entries', [rel('sheet', 'time_sheets'), rel('sheet_line', 'time_sheet_lines'), rel('employee', 'hr_employees'), rel('analytic_account', 'accounting_analytic_accounts'), text('date', 10), num('duration_minutes', 1440), choice('work_type', ['be', 'production']), text('description', 2000), choice('status', states), rel('validated_by', 'core_users'), new DateField({ name: 'validated_at' }), text('source_provider'), text('source_record_id'), new JSONField({ name: 'cost_snapshot', hidden: true })], ['CREATE UNIQUE INDEX idx_time_entry_day ON time_entries(sheet_line,date)', 'CREATE INDEX idx_time_entry_analytic ON time_entries(analytic_account,status,date)'])
  create('time_activities', [rel('product', 'inventory_products'), new BoolField({ name: 'active' }), new JSONField({ name: 'work_types' }), text('valid_from', 10), text('valid_to', 10)], ['CREATE UNIQUE INDEX idx_time_activity_product ON time_activities(product)'])
  create('time_favorites', [rel('user', 'core_users'), rel('product', 'inventory_products'), rel('analytic_account', 'accounting_analytic_accounts'), rel('sales_order_line', 'sales_order_lines'), choice('context', ['affair', 'presales', 'internal'])], ['CREATE UNIQUE INDEX idx_time_favorite ON time_favorites(user,product,analytic_account,sales_order_line,context)'])
  const users = app.findCollectionByNameOrId('core_users'); users.fields.add(new SelectField({ name: 'time_scope', values: ['none', 'self', 'reports', 'all'], maxSelect: 1 })); app.save(users)
  for (const u of app.findAllRecords('core_users')) {
    const admin = u.getString('erp_profile') === 'admin'; u.set('time_scope', admin ? 'all' : 'none')
    if (admin) {
      let role = app.findRecordById('core_roles', u.getString('role')), rights = JSON.parse(role.getString('permissions') || '[]')
      if (app.findRecordsByFilter('core_users', 'role = {:role} && erp_profile != "admin"', '', 1, 0, { role: role.id }).length) {
        const isolated = new Record(role.collection()); for (const [k, v] of Object.entries({ name: 'time_admin_' + u.id, label: role.getString('label'), active: role.getBool('active'), permissions: rights })) isolated.set(k, v)
        app.save(isolated); role = isolated; u.set('role', role.id)
      }
      role.set('permissions', [...new Set([...rights, ...['read', 'write', 'submit', 'validate', 'settings', 'costs'].map((a) => `time.${a}`)])]); app.save(role)
    }
    app.save(u)
  }
  const preferences = app.findCollectionByNameOrId('core_notification_preferences'); const events = preferences.fields.getByName('event_type'); events.values = [...events.values, 'time_requests', 'time_updates']; app.save(preferences)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ~ \'"time.read"\''
  const scope = '(user = @request.auth.id || @request.auth.time_scope = "all" || (@request.auth.time_scope = "reports" && manager = @request.auth.id && status != "draft"))'
  const sheet = app.findCollectionByNameOrId('time_sheets'); sheet.viewRule = `${auth} && (@request.auth.time_scope = "self" || @request.auth.time_scope = "reports" || @request.auth.time_scope = "all") && ${scope}`; app.save(sheet)
  const n = app.findCollectionByNameOrId('core_notifications'), own = `${auth} && (@request.auth.time_scope = "self" || @request.auth.time_scope = "reports" || @request.auth.time_scope = "all") && user = @request.auth.id && source_module = "time"`
  n.listRule = `(${n.listRule}) || (${own})`; n.viewRule = `(${n.viewRule}) || (${own})`; app.save(n)
  const root = '@collection.time_sheets:time.id ?= source_record_id'
  const readable = `${auth} && (@request.auth.time_scope = "self" || @request.auth.time_scope = "reports" || @request.auth.time_scope = "all") && source_module = "time" && source_entity = "time_sheets" && ${root} && (@collection.time_sheets:time.user ?= @request.auth.id || @request.auth.time_scope = "all" || (@request.auth.time_scope = "reports" && @collection.time_sheets:time.manager ?= @request.auth.id && @collection.time_sheets:time.status != "draft"))`
  for (const name of ['core_activity_events', 'core_tasks']) { const c = app.findCollectionByNameOrId(name); c.viewRule = `(${c.viewRule}) || (${readable})`; app.save(c) }
}, () => { throw new Error('Préserver les temps et leurs coûts historiques ; restauration cohérente ou migration corrective.') })
