onRecordValidate((event) => {
  const record = event.record
  record.set('label', record.getString('label').trim())
  if (!record.isNew() && record.getString('code') !== record.original().getString('code')) throw new BadRequestError('Reference codes are immutable.')
  event.next()
}, 'settings_countries', 'settings_languages', 'accounting_currencies', 'inventory_units')
onRecordCreateRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'settings_countries', 'settings_languages', 'accounting_currencies', 'inventory_units')
onRecordUpdateRequest((event) => { event.record.set('__audit_actor', event.auth && event.auth.collection().name === 'core_users' ? event.auth.id : ''); event.next() }, 'settings_countries', 'settings_languages', 'accounting_currencies', 'inventory_units')
onRecordCreate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'create') }, 'settings_countries', 'settings_languages', 'accounting_currencies', 'inventory_units')
onRecordUpdate((event) => { require(`${__hooks}/lib/audit.js`)(event, 'update') }, 'settings_countries', 'settings_languages', 'accounting_currencies', 'inventory_units')
