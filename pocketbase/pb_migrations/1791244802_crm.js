migrate((app) => {
  const names = ['crm_stages', 'crm_opportunities', 'accounting_analytic_accounts', 'settings_numbering_sequences']
  if (app.findAllCollections().some((collection) => names.includes(collection.name))) throw new Error('CRM migration refused: a target collection exists; review the schema before installation.')
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const read = `${auth} && @request.auth.role.permissions ~ '"crm.read"'`
  const reference = `${auth} && @request.auth.role.permissions ~ '"settings.references"'`
  const text = (name, max, required = false) => ({ name, type: 'text', max, required })
  const relation = (name, collection, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(collection).id, required, maxSelect: 1, cascadeDelete: false })
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const stages = new Collection({ name: 'crm_stages', type: 'base', listRule: `(${read}) || (${reference})`, viewRule: `(${read}) || (${reference})`, createRule: reference, updateRule: reference, deleteRule: null,
    fields: [text('code', 40, true), text('label', 80, true), { name: 'sort_order', type: 'number', onlyInt: true, min: 0 }, { name: 'tone', type: 'select', required: true, maxSelect: 1, values: ['blue', 'violet', 'pink'] }, { name: 'active', type: 'bool' }, ...dates], indexes: ['CREATE UNIQUE INDEX idx_crm_stage_code ON crm_stages (code)'] })
  app.save(stages)
  for (const [index, [code, label, tone]] of [['qualification', 'Qualification', 'blue'], ['proposal', 'Proposition', 'violet'], ['negotiation', 'Négociation', 'pink']].entries()) {
    const record = new Record(stages)
    for (const [key, value] of Object.entries({ code, label, tone, sort_order: index * 10, active: true })) record.set(key, value)
    app.save(record)
  }
  const sequence = new Collection({ name: 'settings_numbering_sequences', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [text('entity_type', 80, true), text('prefix', 20), text('suffix', 20), text('pattern', 80, true), text('separator', 5), { name: 'padding', type: 'number', min: 1, max: 12, onlyInt: true }, { name: 'next_value', type: 'number', min: 1, max: 999999999999, onlyInt: true }, { name: 'reset_rule', type: 'select', values: ['never'], maxSelect: 1, required: true }, { name: 'active', type: 'bool' }, ...dates], indexes: ['CREATE UNIQUE INDEX idx_numbering_entity ON settings_numbering_sequences (entity_type)'] })
  app.save(sequence)
  const counter = new Record(sequence)
  for (const [key, value] of Object.entries({ entity_type: 'crm_opportunities', pattern: '{sequence}', padding: 5, next_value: 1, reset_rule: 'never', active: true })) counter.set(key, value)
  app.save(counter)
  const analytic = new Collection({ name: 'accounting_analytic_accounts', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null,
    fields: [text('code', 80, true), text('label', 160, true), relation('company', 'contacts_companies', true), { name: 'status', type: 'select', values: ['open', 'closed'], maxSelect: 1, required: true }, { name: 'active', type: 'bool' }, ...dates], indexes: ['CREATE UNIQUE INDEX idx_analytic_code ON accounting_analytic_accounts (code)'] })
  app.save(analytic)
  const opportunities = new Collection({ name: 'crm_opportunities', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null,
    fields: [text('opportunity_number', 80, true), relation('analytic_account', 'accounting_analytic_accounts', true), text('title', 160, true), relation('company', 'contacts_companies', true), relation('contact', 'contacts_people'), relation('owner', 'core_users', true), { name: 'type', type: 'select', values: ['direct'], maxSelect: 1, required: true }, relation('stage', 'crm_stages', true), ...['estimated_value', 'estimated_cost'].map((name) => ({ name, type: 'number', min: 0, max: 999999999999 })), { name: 'estimated_margin', type: 'number' }, text('currency', 3, true), { name: 'probability', type: 'number', min: 0, max: 100, onlyInt: true }, { name: 'expected_date', type: 'date' }, text('description', 10000), { name: 'status', type: 'select', values: ['open', 'won', 'lost', 'cancelled'], required: true, maxSelect: 1 }, { name: 'active', type: 'bool' }, { ...text('creation_key', 64), hidden: true }, { ...relation('creation_actor', 'core_users'), hidden: true }, ...dates], indexes: ['CREATE UNIQUE INDEX idx_crm_number ON crm_opportunities (opportunity_number)', "CREATE UNIQUE INDEX idx_crm_creation_key ON crm_opportunities (creation_key) WHERE creation_key != ''", 'CREATE INDEX idx_crm_pipeline ON crm_opportunities (active, status, stage, company)'] })
  app.save(opportunities)
  analytic.fields.add(new RelationField({ name: 'opportunity', collectionId: opportunities.id, maxSelect: 1, cascadeDelete: false }))
  app.save(analytic)
  const contactSource = '(source_module = "contacts" && @request.auth.role.permissions ~ \'"contacts.read"\' && ((source_entity = "contacts_companies" && @collection.contacts_companies.id ?= source_record_id) || (source_entity = "contacts_people" && @collection.contacts_people.id ?= source_record_id)))'
  const crmSource = '(source_module = "crm" && @request.auth.role.permissions ~ \'"crm.read"\' && source_entity = "crm_opportunities" && @collection.crm_opportunities.id ?= source_record_id)'
  const activityRead = `${auth} && (${contactSource} || ${crmSource})`
  const activityWrite = `${activityRead} && ((source_module = "contacts" && @request.auth.role.permissions ~ '"contacts.write"') || (source_module = "crm" && @request.auth.role.permissions ~ '"crm.write"'))`
  for (const name of ['core_activity_events', 'core_tasks']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.listRule = activityRead; collection.viewRule = activityRead
    if (name === 'core_activity_events') collection.createRule = activityWrite
    else collection.updateRule = activityWrite
    app.save(collection)
  }
  const notifications = app.findCollectionByNameOrId('core_notifications')
  const own = `${auth} && user = @request.auth.id && (type != "activity" || (${activityRead}))`
  notifications.listRule = own; notifications.viewRule = own
  notifications.updateRule = `${own} && @request.body.user:changed = false && @request.body.type:changed = false && @request.body.title:changed = false && @request.body.body:changed = false && @request.body.source_module:changed = false && @request.body.source_entity:changed = false && @request.body.source_record_id:changed = false && @request.body.activity_event:changed = false && @request.body.created:changed = false`
  app.save(notifications)
}, () => { throw new Error('CRM rollback refused: preserve opportunities, analytic accounts and numbering; use a corrective migration.') })
