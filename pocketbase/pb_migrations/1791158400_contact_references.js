migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const write = `${auth} && @request.auth.role.permissions ~ '"settings.references"'`
  const catalogs = [
    ['settings_countries', [['FR', 'France'], ['BE', 'Belgique'], ['CH', 'Suisse'], ['LU', 'Luxembourg'], ['DE', 'Allemagne'], ['ES', 'Espagne'], ['IT', 'Italie'], ['GB', 'Royaume-Uni'], ['NL', 'Pays-Bas'], ['PT', 'Portugal'], ['US', 'États-Unis'], ['CA', 'Canada'], ['MA', 'Maroc'], ['DZ', 'Algérie'], ['TN', 'Tunisie'], ['CN', 'Chine'], ['JP', 'Japon'], ['AU', 'Australie']]],
    ['settings_languages', [['fr', 'Français'], ['en', 'Anglais'], ['de', 'Allemand'], ['es', 'Espagnol'], ['it', 'Italien'], ['nl', 'Néerlandais'], ['pt', 'Portugais'], ['ar', 'Arabe']]],
    ['accounting_currencies', [['EUR', 'Euro', 2], ['CHF', 'Franc suisse', 2], ['GBP', 'Livre sterling', 2], ['USD', 'Dollar américain', 2], ['CAD', 'Dollar canadien', 2], ['MAD', 'Dirham marocain', 2], ['DZD', 'Dinar algérien', 2], ['TND', 'Dinar tunisien', 3], ['JPY', 'Yen', 0], ['CNY', 'Yuan', 2], ['AUD', 'Dollar australien', 2]]],
  ]
  const names = app.findAllCollections().map((collection) => collection.name)
  if (catalogs.some(([name]) => names.includes(name))) throw new Error('Reference migration refused: target catalog already exists; review its schema first.')
  const companies = app.findAllRecords('contacts_companies')
  for (const record of companies) {
    const old = record.getString('preferred_currency'), current = record.getString('default_currency')
    if (old && current && old !== current) throw new Error(`Currency conflict on company ${record.id}; resolve explicitly before migration.`)
  }
  for (const [name, values] of catalogs) {
    const pattern = name === 'settings_countries' ? '^[A-Z]{2}$' : name === 'accounting_currencies' ? '^[A-Z]{3}$' : '^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$'
    const collection = new Collection({ name, type: 'base', listRule: auth, viewRule: auth, createRule: write, updateRule: write, deleteRule: null,
      fields: [{ type: 'text', name: 'code', required: true, max: 35, pattern }, { type: 'text', name: 'label', required: true, max: 120 }, { type: 'number', name: 'sort_order', onlyInt: true, min: 0 }, { type: 'bool', name: 'active' },
        ...(name === 'accounting_currencies' ? [{ type: 'number', name: 'minor_unit_digits', required: false, onlyInt: true, min: 0, max: 4 }] : []),
        { type: 'autodate', name: 'created', onCreate: true }, { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }],
      indexes: [`CREATE UNIQUE INDEX idx_${name}_code ON ${name} (code)`] })
    app.save(collection)
    const legacy = name === 'settings_countries' ? app.findAllRecords('contacts_addresses').map((r) => r.getString('country')) : companies.flatMap((r) => name === 'settings_languages' ? [r.getString('preferred_language')] : [r.getString('default_currency'), r.getString('preferred_currency')])
    for (const code of legacy) if (code && !values.some((value) => value[0] === code)) values.push([code, code, ['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].includes(code) ? 3 : ['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'].includes(code) ? 0 : ['CLF', 'UYW'].includes(code) ? 4 : 2])
    for (let i = 0; i < values.length; i++) { const [code, label, digits] = values[i]; const record = new Record(collection); record.set('code', code); record.set('label', label); record.set('sort_order', i); record.set('active', true); if (name === 'accounting_currencies') record.set('minor_unit_digits', digits); app.save(record) }
  }
  for (const record of companies) if (!record.getString('default_currency') && record.getString('preferred_currency')) { record.set('default_currency', record.getString('preferred_currency')); app.save(record) }
  const company = app.findCollectionByNameOrId('contacts_companies')
  company.fields.removeByName('preferred_currency')
  company.fields.getByName('preferred_language').max = 35
  company.fields.add(new TextField({ name: 'siren', max: 9, pattern: '^[0-9]{9}$' }))
  company.fields.add(new TextField({ name: 'siret', max: 14, pattern: '^[0-9]{14}$' }))
  company.fields.add(new JSONField({ name: 'enrichment', maxSize: 3000 }))
  app.save(company)
  const addresses = app.findCollectionByNameOrId('contacts_addresses')
  addresses.fields.add(new BoolField({ name: 'is_primary' }))
  addresses.indexes.push('CREATE UNIQUE INDEX idx_contacts_primary_address ON contacts_addresses (company, type) WHERE is_primary = 1')
  app.save(addresses)
  app.save(new Collection({ name: 'core_company_lookup_limits', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [{ type: 'number', name: 'count', onlyInt: true, min: 0 }, { type: 'number', name: 'reset_at', min: 0 }] }))
  const all = app.findAllRecords('contacts_addresses')
  for (const record of all) if (all.filter((other) => other.getString('company') === record.getString('company') && other.getString('type') === record.getString('type')).length === 1) { record.set('is_primary', true); app.save(record) }
}, () => { throw new Error('Rollback refused: preserve catalog references and company data; use a corrective migration.') })
