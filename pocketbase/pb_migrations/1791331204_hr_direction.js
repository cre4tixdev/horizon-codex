migrate((app) => {
  const employees = app.findCollectionByNameOrId('hr_employees')
  employees.fields.add(new BoolField({ name: 'is_direction' }))
  app.save(employees)
}, (app) => {
  const employees = app.findCollectionByNameOrId('hr_employees')
  if (app.findRecordsByFilter(employees, 'is_direction = true', '', 1).length) throw new Error('Réaffectez les responsabilités Direction avant de retirer ce champ.')
  employees.fields.removeByName('is_direction')
  app.save(employees)
})
