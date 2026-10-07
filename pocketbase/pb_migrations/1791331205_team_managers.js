migrate((app) => {
  const teams = app.findCollectionByNameOrId('core_teams')
  teams.fields.getByName('code').hidden = true
  teams.fields.add(new RelationField({ name: 'managers', collectionId: app.findCollectionByNameOrId('hr_employees').id, maxSelect: 100, cascadeDelete: false }))
  app.save(teams)
}, (app) => {
  const teams = app.findCollectionByNameOrId('core_teams')
  if (app.findRecordsByFilter(teams, 'managers:length > 0', '', 1).length) throw new Error('Retirez les managers des équipes avant de revenir au schéma précédent.')
  teams.fields.removeByName('managers')
  teams.fields.getByName('code').hidden = false
  app.save(teams)
})
