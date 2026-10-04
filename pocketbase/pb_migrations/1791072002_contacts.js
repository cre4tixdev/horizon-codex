migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  // JSON permissions are matched as complete quoted strings, never prefixes.
  const read = `${auth} && @request.auth.role.permissions ~ '"contacts.read"'`
  const write = `${read} && @request.auth.role.permissions ~ '"contacts.write"'`
  const text = (name, max, required = false, pattern = '') => ({ type: 'text', name, max, required, pattern })
  const file = (name, maxSelect) => ({ type: 'file', name, maxSelect, maxSize: 2097152, protected: true, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] })
  const company = { type: 'relation', name: 'company', collectionId: 'hzncompanies001', maxSelect: 1, cascadeDelete: false, required: true }
  const dates = [{ type: 'autodate', name: 'created', onCreate: true }, { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }]
  const definitions = [
    { id: 'hzncompanies001', name: 'contacts_companies', fields: [
      text('name', 160, true), text('legal_name', 200), text('vat_number', 80), text('fiscal_identifier', 80),
      text('preferred_language', 12), text('preferred_currency', 3, false, '^[A-Z]{3}$'), text('default_currency', 3, false, '^[A-Z]{3}$'),
      { type: 'url', name: 'website' }, text('phone', 40), { type: 'email', name: 'email' },
      file('logo', 1), file('images', 10), text('notes', 10000), { type: 'bool', name: 'active' },
    ], indexes: ['CREATE INDEX idx_contacts_companies_active_name ON contacts_companies (active, name)'] },
    { id: 'hzncomproles001', name: 'contacts_company_roles', fields: [company,
      { type: 'select', name: 'role', required: true, maxSelect: 1, values: ['customer', 'prospect', 'supplier', 'partner', 'other'] },
      { type: 'bool', name: 'active' },
    ], indexes: ['CREATE UNIQUE INDEX idx_contacts_company_role ON contacts_company_roles (company, role)'] },
    { id: 'hznpeople000001', name: 'contacts_people', fields: [ { ...company, required: false },
      text('first_name', 80), text('last_name', 80), text('job_title', 120), { type: 'email', name: 'email' },
      text('phone', 40), text('mobile', 40), file('avatar', 1), text('notes', 10000), { type: 'bool', name: 'active' },
    ], indexes: ['CREATE INDEX idx_contacts_people_company ON contacts_people (company)'] },
    { id: 'hznaddresses001', name: 'contacts_addresses', fields: [company,
      { type: 'select', name: 'type', required: true, maxSelect: 1, values: ['registered', 'billing', 'shipping', 'other'] },
      text('line1', 200, true), text('line2', 200), text('postal_code', 20), text('city', 100, true),
      text('country', 2, true, '^[A-Z]{2}$'), text('state_region', 100),
    ], indexes: ['CREATE INDEX idx_contacts_addresses_company ON contacts_addresses (company)'] },
  ]
  // Refuse UI-created conflicting collections rather than overwrite their schema/data.
  const names = app.findAllCollections().map((collection) => collection.name)
  if (definitions.some((definition) => names.includes(definition.name))) throw new Error('Contacts migration refused: a target collection already exists.')
  if (!names.includes('core_audit')) {
    app.save(new Collection({ id: 'hznaudit0000001', name: 'core_audit', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [ { type: 'relation', name: 'user', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, cascadeDelete: false },
        text('module', 80, true), text('action', 80, true), text('entity', 80, true), text('entity_id', 15, true),
        { type: 'json', name: 'before', maxSize: 100000 }, { type: 'json', name: 'after', maxSize: 100000 },
        { type: 'json', name: 'metadata', maxSize: 10000 }, ...dates.filter((field) => field.name === 'created') ],
      indexes: ['CREATE INDEX idx_core_audit_entity ON core_audit (entity, entity_id, created)'],
    }))
  } else {
    const audit = app.findCollectionByNameOrId('core_audit')
    for (const name of ['user', 'module', 'action', 'entity', 'entity_id', 'before', 'after', 'metadata', 'created']) {
      if (!audit.fields.getByName(name)) throw new Error(`Contacts migration refused: core_audit.${name} missing.`)
    }
    const schema = JSON.parse(JSON.stringify(audit))
    if (schema.type !== 'base' || ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'].some((rule) => schema[rule] !== null)) throw new Error('Contacts migration refused: audit must be a locked base collection.')
    for (const name of ['before', 'after', 'metadata']) {
      if (schema.fields.find((field) => field.name === name).type !== 'json') throw new Error(`Contacts migration refused: core_audit.${name} must be JSON.`)
    }
  }
  for (const definition of definitions) app.save(new Collection({ ...definition, type: 'base', listRule: read, viewRule: read, createRule: write, updateRule: write, deleteRule: null, fields: [...definition.fields, ...dates] }))
}, () => { throw new Error('Contacts rollback refused: preserve references and audit history; use a reviewed corrective migration.') })
