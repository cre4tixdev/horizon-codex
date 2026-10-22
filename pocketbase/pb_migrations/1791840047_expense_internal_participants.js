migrate((app) => {
  const lines = app.findCollectionByNameOrId('expenses_lines')
  if (!lines.fields.getByName('internal_participants')) lines.fields.add(new RelationField({ name: 'internal_participants', collectionId: app.findCollectionByNameOrId('hr_employees').id, maxSelect: 30, cascadeDelete: false }))
  app.save(lines)
}, () => { throw new Error('Conserver les participants historiques des dépenses ; utiliser une migration corrective.') })
