migrate((app) => {
  const collection = app.findCollectionByNameOrId('crm_tenders')
  collection.fields.getByName('opportunity').required = false
  collection.indexes = ["CREATE UNIQUE INDEX idx_tender_opportunity ON crm_tenders (opportunity) WHERE opportunity != ''", "CREATE UNIQUE INDEX idx_tender_creation ON crm_tenders (creation_key) WHERE creation_key != ''"]
  const rel = (name, target, maxSelect = 1) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(target).id, maxSelect, cascadeDelete: false })
  for (const field of [new TextField({ name: 'title', max: 160 }), rel('company', 'contacts_companies'), rel('contact', 'contacts_people'), rel('owner', 'core_users'), rel('market_types', 'crm_market_types', 50), new TextField({ name: 'currency', max: 3 }), new TextField({ name: 'description', max: 10000 }), new JSONField({ name: 'description_content', maxSize: 200000 }), new DateField({ name: 'expected_date' }), new BoolField({ name: 'active' }), new TextField({ name: 'creation_key', max: 64, hidden: true }), new RelationField({ name: 'creation_actor', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, hidden: true }), ...['estimated_value', 'estimated_cost'].map((name) => new NumberField({ name, min: 0, max: 999999999999 })), new NumberField({ name: 'probability', min: 0, max: 100, onlyInt: true })]) collection.fields.add(field)
  app.save(collection)
  for (const tender of app.findRecordsByFilter('crm_tenders', '', '', 0)) { tender.set('active', true); app.save(tender) }
  const status = new Record(app.findCollectionByNameOrId('crm_tender_statuses'))
  for (const [key, value] of Object.entries({ code: 'no_go', label: 'No go', tone: 'navy', color: '#718096', sort_order: 50, active: true })) status.set(key, value)
  app.save(status)
  for (const name of ['core_activity_events', 'core_tasks', 'core_notifications']) {
    const target = app.findCollectionByNameOrId(name)
    for (const rule of ['listRule', 'viewRule', 'createRule', 'updateRule']) {
      if (target[rule]) target[rule] = target[rule].replace('source_entity = "crm_opportunities" && @collection.crm_opportunities.id ?= source_record_id', '((source_entity = "crm_opportunities" && @collection.crm_opportunities.id ?= source_record_id) || (source_entity = "crm_tenders" && @collection.crm_tenders.id ?= source_record_id))')
    }
    app.save(target)
  }
}, () => { throw new Error('Rollback refused: standalone AO and their history must be retained.') })
