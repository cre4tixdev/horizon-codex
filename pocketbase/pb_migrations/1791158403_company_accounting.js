migrate((app) => {
  const company = app.findCollectionByNameOrId('contacts_companies')
  // Keep fiscal_identifier as legacy data: it is not semantically a RCS number.
  for (const [name, max] of [['rcs_number', 120], ['einvoice_routing_address', 120], ['einvoice_platform', 120], ['einvoice_service_code', 100]]) company.fields.add(new TextField({ name, max }))
  company.fields.add(new EmailField({ name: 'billing_email' }))
  company.fields.add(new SelectField({ name: 'einvoice_status', maxSelect: 1, values: ['unknown', 'to_configure', 'ready', 'not_applicable'] }))
  app.save(company)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const read = `${auth} && @request.auth.role.permissions ~ '"contacts.read"'`
  const write = `${read} && @request.auth.role.permissions ~ '"contacts.write"'`
  if (app.findAllCollections().some((item) => item.name === 'accounting_third_party_accounts')) throw new Error('Accounting profile migration refused: review the existing collection first.')
  app.save(new Collection({ name: 'accounting_third_party_accounts', type: 'base', listRule: read, viewRule: read, createRule: write, updateRule: write, deleteRule: null,
    fields: [{ type: 'relation', name: 'company', collectionId: company.id, required: true, maxSelect: 1, cascadeDelete: false },
      { type: 'select', name: 'type', required: true, maxSelect: 1, values: ['customer', 'supplier'] },
      { type: 'text', name: 'account_code', max: 32, pattern: '^[A-Za-z0-9][A-Za-z0-9._-]*$' }, { type: 'bool', name: 'active' },
      { type: 'autodate', name: 'created', onCreate: true }, { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }],
    indexes: ['CREATE UNIQUE INDEX idx_accounting_company_type ON accounting_third_party_accounts (company, type)'],
  }))
}, () => { throw new Error('Rollback refused: preserve accounting and company data; use a corrective migration.') })
