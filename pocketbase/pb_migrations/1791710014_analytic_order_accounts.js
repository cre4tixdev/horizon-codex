migrate((app) => {
  const accounts = app.findCollectionByNameOrId('accounting_analytic_accounts')
  accounts.fields.add(new RelationField({ name: 'parent', collectionId: accounts.id, maxSelect: 1 }))
  accounts.fields.add(new RelationField({ name: 'source_quote', collectionId: app.findCollectionByNameOrId('sales_quotes').id, maxSelect: 1 }))
  const index = "CREATE UNIQUE INDEX idx_analytic_quote ON accounting_analytic_accounts (source_quote) WHERE source_quote != ''"
  if (!accounts.indexes.includes(index)) accounts.indexes.push(index)
  app.save(accounts)
  const orders = app.findCollectionByNameOrId('sales_orders')
  orders.fields.add(new RelationField({ name: 'analytic_child', collectionId: accounts.id, maxSelect: 1 }))
  app.save(orders)
  const children = new Map()
  for (const order of app.findAllRecords('sales_orders')) {
    const quote = app.findRecordById('sales_quotes', order.getString('quote'))
    let child = children.get(quote.id)
    if (!child) {
      child = new Record(accounts)
      for (const [key, value] of Object.entries({ code: quote.getString('quote_number'), label: quote.getString('title'), company: quote.getString('company'), opportunity: quote.getString('opportunity'), parent: quote.getString('analytic_account'), source_quote: quote.id, status: 'open', active: true })) child.set(key, value)
      app.save(child); children.set(quote.id, child)
    }
    // Only initialize the new relation; preserve updated and immutable document snapshots.
    app.db().newQuery('UPDATE sales_orders SET analytic_child = {:child} WHERE id = {:id}').bind({ child: child.id, id: order.id }).execute()
  }
}, () => { throw new Error('Restore a coherent backup to preserve analytic order accounts and their allocations.') })
