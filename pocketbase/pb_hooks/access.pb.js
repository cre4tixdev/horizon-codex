routerAdd('GET', '/api/horizon/access/users', (event) => require(`${__hooks}/lib/access-management.js`).list(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/access/users/save', (event) => require(`${__hooks}/lib/access-management.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('GET', '/api/horizon/hr/directory', (event) => require(`${__hooks}/lib/employees.js`).directory(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/hr/employees/save', (event) => require(`${__hooks}/lib/employees.js`).save(event), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/hr/teams/save', (event) => require(`${__hooks}/lib/employees.js`).team(event), $apis.requireAuth('core_users'))
onRecordValidate((event) => {
  if (event.record.collection().fields.getByName('erp_profile') && !event.record.getString('erp_profile')) event.record.set('erp_profile', 'user')
  event.next()
}, 'core_users')
