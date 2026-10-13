migrate((app) => {
  const terms = new Collection({ name: 'settings_payment_terms', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [], indexes: ['CREATE UNIQUE INDEX idx_settings_payment_terms_code ON settings_payment_terms (code)'] })
  for (const field of [new TextField({ name: 'code', required: true, max: 40 }), new TextField({ name: 'label', required: true, max: 120 }), new TextField({ name: 'description', max: 2000 }), new SelectField({ name: 'schedule_type', values: ['days'], maxSelect: 1 }), new NumberField({ name: 'days', min: 0, max: 365, onlyInt: true }), new JSONField({ name: 'installments' }), new BoolField({ name: 'active' }), new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) terms.fields.add(field)
  app.save(terms)
  const settings = app.findAllRecords('settings_billing')[0], days = settings.getInt('payment_days'), description = settings.getString('payment_terms')
  let defaultId = ''
  for (const value of [...new Set([days, 0, 30, 45, 60])]) {
    const record = new Record(terms); record.set('code', `DAYS${value}`); record.set('label', value ? `${value} jours` : 'À réception'); record.set('description', value === days ? description : value ? `Paiement à ${value} jours.` : 'Paiement à réception.'); record.set('schedule_type', 'days'); record.set('days', value); record.set('installments', []); record.set('active', true); app.save(record); if (value === days) defaultId = record.id
  }
  for (const [name, field] of [['settings_billing', 'default_payment_term'], ['contacts_companies', 'payment_term'], ...['billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes'].map((name) => [name, 'payment_term'])]) {
    const collection = app.findCollectionByNameOrId(name); collection.fields.add(new RelationField({ name: field, collectionId: terms.id, maxSelect: 1 })); app.save(collection)
  }
  const current = app.findRecordById('settings_billing', settings.id); current.set('default_payment_term', defaultId); app.save(current)
}, () => { throw new Error('Rollback refusé : préserver les conditions et leurs relations historiques ; utiliser une migration corrective.') })
