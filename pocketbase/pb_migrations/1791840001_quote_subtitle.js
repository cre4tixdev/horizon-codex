migrate((app) => {
  for (const name of ['sales_quote_lines', 'sales_order_lines']) {
    const collection = app.findCollectionByNameOrId(name)
    const field = collection.fields.getByName('kind')
    if (!field.values.includes('subtitle')) field.values.push('subtitle')
    app.save(collection)
  }
}, () => { throw new Error('Restore a coherent backup instead of removing subtitle lines.') })
