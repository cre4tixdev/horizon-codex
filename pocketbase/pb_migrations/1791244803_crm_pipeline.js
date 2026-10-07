migrate((app) => {
  const stages = app.findCollectionByNameOrId('crm_stages')
  const statuses = ['open', 'won', 'completed', 'lost', 'cancelled']
  stages.fields.add(new SelectField({ name: 'status', values: statuses, maxSelect: 1, required: true }))
  app.save(stages)
  for (const record of app.findAllRecords(stages)) { record.set('status', 'open'); app.save(record) }
  const defaults = [['new', 'Nouveau', 'blue', 'open'], ['qualified', 'Qualifié', 'violet', 'open'], ['won', 'Gagné', 'blue', 'won'], ['completed', 'Terminé', 'violet', 'completed'], ['lost', 'Perdue', 'pink', 'lost'], ['cancelled', 'Annulé', 'pink', 'cancelled']]
  const targets = {}
  defaults.forEach(([code, label, tone, status], index) => {
    const existing = app.findRecordsByFilter(stages, 'code = {:code}', '', 1, 0, { code })[0]
    const record = existing || new Record(stages)
    for (const [key, value] of Object.entries({ code, label, tone, status, sort_order: index * 10, active: true })) record.set(key, value)
    app.save(record); targets[code] = record.id
  })
  const opportunities = app.findCollectionByNameOrId('crm_opportunities')
  opportunities.fields.getByName('status').values = statuses
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const read = `${auth} && (@request.auth.role.permissions ~ '"crm.read"' || @request.auth.role.permissions ~ '"settings.references"')`
  const write = `${auth} && @request.auth.role.permissions ~ '"settings.references"'`
  if (app.findAllCollections().some((collection) => collection.name === 'crm_market_types')) throw new Error('CRM market types already exist; review before migration.')
  const markets = new Collection({ name: 'crm_market_types', type: 'base', listRule: read, viewRule: read, createRule: write, updateRule: write, deleteRule: null, fields: [
    { name: 'code', type: 'text', required: true, max: 35 }, { name: 'label', type: 'text', required: true, max: 120 }, { name: 'active', type: 'bool' }, { name: 'sort_order', type: 'number', min: 0, onlyInt: true }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ], indexes: ['CREATE UNIQUE INDEX idx_crm_market_code ON crm_market_types (code)'] })
  app.save(markets)
  ;[['broadcast', 'Broadcast'], ['corporate', 'Corporate'], ['institutional', 'Institutionnel'], ['events', 'Événementiel'], ['consulting', 'Consulting'], ['export', 'Export']].forEach(([code, label], index) => {
    const record = new Record(markets)
    for (const [key, value] of Object.entries({ code, label, active: true, sort_order: index * 10 })) record.set(key, value)
    app.save(record)
  })
  opportunities.fields.add(new RelationField({ name: 'market_type', collectionId: markets.id, maxSelect: 1, cascadeDelete: false }))
  opportunities.fields.add(new JSONField({ name: 'description_content', maxSize: 100000 }))
  app.save(opportunities)
  for (const old of app.findRecordsByFilter(stages, 'code = "qualification" || code = "proposal" || code = "negotiation"', '', 0)) {
    for (const opportunity of app.findRecordsByFilter(opportunities, 'stage = {:id}', '', 0, 0, { id: old.id })) {
      const status = opportunity.getString('status')
      opportunity.set('stage', targets[status === 'open' ? old.getString('code') === 'qualification' ? 'new' : 'qualified' : status])
      app.save(opportunity)
    }
    old.set('active', false); app.save(old)
  }
  // Before this revision, state could be edited independently of any custom stage.
  for (const opportunity of app.findAllRecords(opportunities)) {
    const stage = app.findRecordById(stages, opportunity.getString('stage'))
    if (opportunity.getString('status') !== stage.getString('status')) { opportunity.set('stage', targets[opportunity.getString('status') === 'open' ? 'new' : opportunity.getString('status')]); app.save(opportunity) }
  }
}, () => { throw new Error('CRM pipeline rollback refused: preserve market types, descriptions and opportunities.') })
