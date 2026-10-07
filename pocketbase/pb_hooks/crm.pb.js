routerAdd('POST', '/api/horizon/crm/save', (event) => require(`${__hooks}/lib/crm.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/crm/stages', (event) => require(`${__hooks}/lib/crm.js`).move(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/crm/archive', (event) => require(`${__hooks}/lib/crm.js`).archive(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/crm/delete', (event) => require(`${__hooks}/lib/crm.js`).remove(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/crm/owners', (event) => require(`${__hooks}/lib/crm.js`).owners(event), $apis.requireAuth('core_users'))
onRecordCreateRequest((event) => { event.record.set('__audit_actor', event.auth ? event.auth.id : ''); require(`${__hooks}/lib/audit.js`)(event, 'create') }, 'crm_stages', 'crm_market_types')
onRecordUpdateRequest((event) => { event.record.set('__audit_actor', event.auth ? event.auth.id : ''); require(`${__hooks}/lib/audit.js`)(event, 'update') }, 'crm_stages', 'crm_market_types')

onRecordValidate((event) => {
  event.record.set('label', event.record.getString('label').trim())
  if (event.record.collection().name === 'crm_stages' && event.record.collection().createRule === null) {
    const states = { new: 'open', qualified: 'open', won: 'won', completed: 'completed', lost: 'lost', cancelled: 'cancelled' }
    const state = states[event.record.getString('code')]
    if (state && (event.record.getString('status') !== state || !event.record.getBool('active')) || !state && event.record.getBool('active')) throw new BadRequestError('Les six étapes commerciales et leur signification sont fixes.')
  }
  if (!event.record.isNew() && event.record.getString('code') !== event.record.original().getString('code')) throw new BadRequestError('Le code d’étape est immuable.')
  if (!event.record.isNew() && event.record.collection().name === 'crm_stages' && event.record.original().getString('status') && event.record.getString('status') !== event.record.original().getString('status') && event.app.findRecordsByFilter('crm_opportunities', 'stage = {:id}', '', 1, 0, { id: event.record.id }).length > 0) throw new BadRequestError('Une étape utilisée ne peut pas changer de signification. Créez une nouvelle étape.')
  event.next()
}, 'crm_stages', 'crm_market_types')

routerAdd('GET', '/api/horizon/crm/summary', (event) => require(`${__hooks}/lib/crm-summary.js`)(event), $apis.requireAuth('core_users'))

onRecordUpdateRequest((event) => { event.record.set('__audit_actor', event.auth ? event.auth.id : ''); require(`${__hooks}/lib/audit.js`)(event, 'update') }, 'settings_crm')
onRecordValidate((event) => {
  if (event.record.getString('code') !== 'crm') throw new BadRequestError('Configuration CRM invalide.')
  event.next()
}, 'settings_crm')
