migrate((app) => {
  const company = app.findCollectionByNameOrId('contacts_companies')
  const existing = JSON.parse(JSON.stringify(company)).fields.find((field) => field.name === 'lei')
  // Accept the exact same field created manually by the administrator.
  if (existing) {
    if (existing.type !== 'text' || existing.max !== 20 || existing.pattern !== '^[A-Z0-9]{20}$' || existing.required) throw new Error('LEI field already exists with a different schema; review it before migration.')
    return
  }
  company.fields.add(new TextField({ name: 'lei', max: 20, pattern: '^[A-Z0-9]{20}$' }))
  // RCS is a distinct identifier: preserve its legacy values without conversion.
  app.save(company)
}, () => { throw new Error('Rollback refused: preserve legal identifiers; use a corrective migration.') })
