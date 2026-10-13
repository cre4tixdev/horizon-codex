migrate((app) => {
  for (const name of ['sales_quote_lines', 'sales_order_lines']) {
    const collection = app.findCollectionByNameOrId(name)
    const field = collection.fields.getByName('kind')
    if (!field.values.includes('spacer')) field.values.push('spacer')
    collection.fields.getByName('description').required = false
    app.save(collection)
  }
}, () => { throw new Error('Restore a coherent backup instead of removing saved spacing lines.') })
