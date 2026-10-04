onRecordValidate((event) => {
  const record = event.record
  const name = record.collection().name
  for (const field of ['name', 'first_name', 'last_name', 'city', 'line1']) {
    if (record.collection().fields.getByName(field)) record.set(field, record.getString(field).trim())
  }
  if (name === 'contacts_companies' && record.getString('website') && !/^https?:\/\//i.test(record.getString('website'))) throw new BadRequestError('Company website must use HTTP or HTTPS.')
  if (name === 'contacts_people' && !record.getString('first_name') && !record.getString('last_name')) throw new BadRequestError('A contact needs a first or last name.')
  if (record.getString('company')) {
    const company = event.app.findRecordById('contacts_companies', record.getString('company'))
    if (!company.getBool('active') && (record.isNew() || record.original().getString('company') !== company.id)) throw new BadRequestError('Cannot attach a record to an archived company.')
  }
  event.next()
}, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses')

onRecordCreateRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses')
onRecordUpdateRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses')
onRecordCreate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'create') }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses')
onRecordUpdate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'update') }, 'contacts_companies', 'contacts_people', 'contacts_company_roles', 'contacts_addresses')
