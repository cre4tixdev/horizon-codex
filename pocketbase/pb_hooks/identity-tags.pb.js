onRecordValidate((event) => {
  const record = event.record
  if (!record.getBool('active')) throw new BadRequestError('Ces tags ne peuvent pas être désactivés.')
  if (!record.isNew()) for (const field of ['code', 'label', 'sort_order', 'active']) {
    if (JSON.stringify(record.get(field)) !== JSON.stringify(record.original().get(field))) throw new BadRequestError('Seule la couleur de ces tags est modifiable.')
  }
  event.next()
}, 'settings_identity_tags', 'crm_appointment_kinds')
onRecordUpdateRequest((event) => {
  event.record.set('__audit_actor', event.auth ? event.auth.id : '')
  require(`${__hooks}/lib/audit.js`)(event, 'update')
}, 'settings_identity_tags', 'crm_appointment_kinds')
