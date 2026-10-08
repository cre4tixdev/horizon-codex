migrate((app) => {
  const collection = app.findCollectionByNameOrId('sales_quote_lines')
  collection.fields.getByName('kind').values = ['item', 'section', 'subsection', 'subsection3', 'note']
  app.save(collection)
  const audit = app.findCollectionByNameOrId('core_audit')
  audit.fields.getByName('metadata').maxSize = 2097152
  app.save(audit)
}, () => { throw new Error('Restore a coherent backup instead of removing third-level sections.') })
