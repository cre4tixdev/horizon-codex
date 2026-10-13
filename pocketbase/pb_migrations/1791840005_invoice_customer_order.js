migrate((app) => {
  for (const name of ['billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes']) {
    const collection = app.findCollectionByNameOrId(name); collection.fields.add(new TextField({ name: 'customer_order_number', max: 1000 })); app.save(collection)
  }
}, () => { throw new Error('Rollback refusé : conserver les références historiques des factures ; utiliser une migration corrective.') })
