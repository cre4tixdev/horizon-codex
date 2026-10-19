migrate((app) => {
  for (const name of ['billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.add(new NumberField({ name: 'deposit_percent', min: 0, max: 100 }))
    app.save(collection)
  }
}, () => { throw new Error('Conserver les taux des acomptes. Utiliser une migration corrective.') })
