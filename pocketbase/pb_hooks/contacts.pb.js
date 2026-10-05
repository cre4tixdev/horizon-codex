onRecordValidate((event) => {
  const record = event.record
  const name = record.collection().name
  for (const field of ['name', 'first_name', 'last_name', 'city', 'line1']) {
    if (record.collection().fields.getByName(field)) record.set(field, record.getString(field).trim())
  }
  if (name === 'contacts_company_roles' && !['customer', 'supplier'].includes(record.getString('role'))) throw new BadRequestError('Company role must be customer or supplier.')
  if (name === 'contacts_companies' && record.getString('website') && !/^https?:\/\//i.test(record.getString('website'))) throw new BadRequestError('Company website must use HTTP or HTTPS.')
  if (name === 'contacts_people' && !record.getString('first_name') && !record.getString('last_name')) throw new BadRequestError('A contact needs a first or last name.')
  if (record.getString('company')) {
    const company = event.app.findRecordById('contacts_companies', record.getString('company'))
    if (!company.getBool('active') && (record.isNew() || record.original().getString('company') !== company.id)) throw new BadRequestError('Cannot attach a record to an archived company.')
  }
  if (name === 'accounting_third_party_accounts' && record.getBool('active') && !record.getString('account_code')) throw new BadRequestError('An active account needs a code.')
  if (name === 'contacts_companies') {
    if (record.isNew() && record.collection().fields.getByName('rcs_number')) { if (!record.getString('preferred_language')) record.set('preferred_language', 'fr'); if (!record.getString('default_currency')) record.set('default_currency', 'EUR'); if (!record.getString('einvoice_status')) record.set('einvoice_status', 'unknown') }
    for (const field of ['siren', 'siret']) if (record.collection().fields.getByName(field)) record.set(field, record.getString(field).replace(/\s/g, ''))
    if (record.getString('siren') && record.getString('siret') && !record.getString('siret').startsWith(record.getString('siren'))) throw new BadRequestError('SIRET must match SIREN.')
  }
  const references = name === 'contacts_companies' ? [['preferred_language', 'settings_languages'], ['default_currency', 'accounting_currencies']] : name === 'contacts_addresses' ? [['country', 'settings_countries']] : []
  const installed = event.app.findAllCollections().map((collection) => collection.name)
  for (const [field, collection] of references) {
    const code = record.getString(field)
    if (!code || !installed.includes(collection)) continue
    let reference
    try { reference = event.app.findFirstRecordByFilter(collection, 'code = {:code}', { code }) } catch { throw new BadRequestError('Reference code is unknown.') }
    if (!reference.getBool('active') && (record.isNew() || record.original().getString(field) !== code)) throw new BadRequestError('Reference is inactive.')
  }
  event.next()
}, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')

onRecordCreateRequest((event) => { if (event.record.collection().name === 'contacts_companies' && event.requestInfo().body.enrichment !== undefined) throw new BadRequestError('Enrichment provenance is server managed.'); event.record.set('__activity_operation', (/^[a-zA-Z0-9-]{16,64}$/.test(event.requestInfo().headers['x_horizon_operation'] || '') ? event.requestInfo().headers['x_horizon_operation'] : '')); event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')
onRecordUpdateRequest((event) => { if (event.record.collection().name === 'contacts_companies' && event.requestInfo().body.enrichment !== undefined) throw new BadRequestError('Enrichment provenance is server managed.'); event.record.set('__activity_operation', (/^[a-zA-Z0-9-]{16,64}$/.test(event.requestInfo().headers['x_horizon_operation'] || '') ? event.requestInfo().headers['x_horizon_operation'] : '')); event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')
onRecordCreate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'create') }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')
onRecordUpdate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'update') }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')

// Guard API requests before PocketBase's relation cascade interceptors run.
onRecordDeleteRequest((event) => {
  const user = event.auth
  if (!user || user.collection().name !== '_superusers') {
    if (!user || user.collection().name !== 'core_users' || !user.getBool('active')) throw new ForbiddenError('Accès refusé.')
    const role = event.app.findRecordById('core_roles', user.getString('role'))
    const permissions = JSON.parse(role.getString('permissions') || '[]')
    if (!role.getBool('active') || !permissions.includes('contacts.read') || !permissions.includes('contacts.write')) throw new ForbiddenError('Accès refusé.')
  }
  event.record.set('__activity_operation', (/^[a-zA-Z0-9-]{16,64}$/.test(event.requestInfo().headers['x_horizon_operation'] || '') ? event.requestInfo().headers['x_horizon_operation'] : '')); event.record.set('__audit_actor', user && user.collection().name === 'core_users' ? user.id : '')
  require(`${__hooks}/lib/contact-deletion.js`)(event, false)
}, 'contacts_companies', 'contacts_people')
onRecordDelete((event) => { require(`${__hooks}/lib/contact-deletion.js`)(event) }, 'contacts_companies', 'contacts_people')
onRecordDelete((event) => { require(`${__hooks}/lib/audit.js`)(event, 'delete') }, 'contacts_company_roles', 'contacts_addresses', 'accounting_third_party_accounts')
