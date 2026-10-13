// Reprise non destructive : les originaux utilisateur restent conservés.
migrate((app) => {
  const users = app.findCollectionByNameOrId('core_users')
  if (!users.fields.getByName('employee_photo_migrated')) { users.fields.add(new BoolField({ name: 'employee_photo_migrated', hidden: true })); app.save(users) }
  const fs = app.newFilesystem()
  try {
    for (const user of app.findAllRecords('core_users')) {
      if (!user.getString('employee') || !user.getString('avatar') || user.getBool('employee_photo_migrated')) continue
      const employee = app.findRecordById('hr_employees', user.getString('employee'))
      if (!employee.getString('avatar')) {
        employee.set('avatar', fs.getReuploadableFile(user.baseFilesPath() + '/' + user.getString('avatar'), false))
        app.save(employee)
      }
      user.set('employee_photo_migrated', true); app.save(user)
    }
  } finally { fs.close() }
}, () => { /* Les photos reprises sont conservées au retour arrière. */ })
