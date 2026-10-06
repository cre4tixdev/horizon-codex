onRecordCreateRequest((event) => {
  if (event.auth && event.auth.collection().name === 'core_users') event.record.set('owner', event.auth.id)
  event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : '')
  event.next()
}, 'core_saved_views')
onRecordUpdateRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'core_saved_views')
onRecordDeleteRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'core_saved_views')
onRecordValidate((event) => {
  const record = event.record
  record.set('name', record.getString('name').trim())
  if (!record.isNew() && (record.getString('owner') !== record.original().getString('owner') || record.getString('context') !== record.original().getString('context'))) throw new BadRequestError('Le propriétaire et le contexte sont immuables.')
  const params = JSON.parse(record.getString('params') || '{}')
  const people = record.getString('context') === 'contacts.people'
  const values = { state: ['active', 'archived'], role: ['all', 'customer', 'supplier'], group: people ? ['none', 'country', 'company'] : ['none', 'country'], view: ['cards', 'list'], sort: people ? ['last_name:asc', 'last_name:desc', 'email:asc', 'email:desc'] : ['name:asc', 'name:desc', 'email:asc', 'email:desc', 'legal_name:asc', 'legal_name:desc'] }
  if (!params || Array.isArray(params) || typeof params !== 'object' || Object.entries(params).some(([key, value]) => typeof value !== 'string' || (key === 'q' ? value.length > 200 : !values[key] || !values[key].includes(value)))) throw new BadRequestError('Critères de vue invalides.')
  record.set('params', params)
  event.next()
}, 'core_saved_views')
onRecordCreate((event) => require(`${__hooks}/lib/audit.js`)(event, 'create'), 'core_saved_views')
onRecordUpdate((event) => require(`${__hooks}/lib/audit.js`)(event, 'update'), 'core_saved_views')
onRecordDelete((event) => require(`${__hooks}/lib/audit.js`)(event, 'delete'), 'core_saved_views')
