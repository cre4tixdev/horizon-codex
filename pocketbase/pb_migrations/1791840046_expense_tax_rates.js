migrate((app) => {
  const lines = app.findCollectionByNameOrId('expenses_lines')
  for (const field of [new TextField({ name: 'tax_code', max: 40 }), new NumberField({ name: 'tax_rate', min: 0, max: 100 })]) if (!lines.fields.getByName(field.name)) lines.fields.add(field)
  app.save(lines)
}, () => { throw new Error('Conserver les taux historiques des dépenses ; utiliser une migration corrective.') })
