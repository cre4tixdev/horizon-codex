migrate((app) => {
  const employees = app.findCollectionByNameOrId('hr_employees')
  employees.fields.add(new BoolField({ name: 'time_reporting_enabled' }))
  app.save(employees)
  const teams = app.findCollectionByNameOrId('core_teams')
  teams.fields.add(new SelectField({ name: 'time_work_type', values: ['none', 'be', 'production'], maxSelect: 1 }))
  app.save(teams)
  app.db().newQuery("UPDATE core_teams SET time_work_type = 'none' WHERE time_work_type = ''").execute()
}, () => { throw new Error('Éligibilité des temps : conserver le paramétrage RH, retour automatique refusé.') })
