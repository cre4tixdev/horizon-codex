migrate((app) => {
  const tones = ['blue', 'violet', 'pink', 'green', 'amber', 'navy']
  const stages = app.findCollectionByNameOrId('crm_stages')
  stages.fields.getByName('tone').values = tones
  app.save(stages)
  const replacements = { won: ['blue', 'green'], completed: ['violet', 'navy'], lost: ['pink', 'amber'] }
  for (const stage of app.findAllRecords(stages)) {
    const replacement = replacements[stage.getString('code')]
    if (replacement && stage.getString('tone') === replacement[0]) { stage.set('tone', replacement[1]); app.save(stage) }
  }
  const markets = app.findCollectionByNameOrId('crm_market_types')
  markets.fields.add(new SelectField({ name: 'tone', values: tones, maxSelect: 1 }))
  app.save(markets)
  const defaults = { broadcast: 'violet', corporate: 'blue', institutional: 'navy', events: 'pink', consulting: 'green', export: 'amber' }
  for (const market of app.findAllRecords(markets)) { market.set('tone', defaults[market.getString('code')] || 'blue'); app.save(market) }
  markets.fields.getByName('tone').required = true
  app.save(markets)
  const opportunities = app.findCollectionByNameOrId('crm_opportunities')
  opportunities.fields.add(new RelationField({ name: 'market_types', collectionId: markets.id, maxSelect: 50, cascadeDelete: false }))
  app.save(opportunities)
  for (const opportunity of app.findAllRecords(opportunities)) {
    const old = opportunity.getString('market_type')
    if (old) { opportunity.set('market_types', [old]); app.save(opportunity) }
  }
  opportunities.fields.removeByName('market_type')
  app.save(opportunities)
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const settings = new Collection({ name: 'settings_crm', type: 'base',
    listRule: `${auth} && (@request.auth.role.permissions ~ '"crm.read"' || @request.auth.role.permissions ~ '"settings.references"')`,
    viewRule: `${auth} && (@request.auth.role.permissions ~ '"crm.read"' || @request.auth.role.permissions ~ '"settings.references"')`,
    createRule: null, updateRule: `${auth} && @request.auth.role.permissions ~ '"settings.references"'`, deleteRule: null,
    fields: [{ name: 'code', type: 'text', required: true, pattern: '^crm$' }, { name: 'default_view', type: 'select', values: ['kanban', 'list'], maxSelect: 1, required: true }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }],
    indexes: ['CREATE UNIQUE INDEX idx_settings_crm_code ON settings_crm (code)'],
  })
  app.save(settings)
  const record = new Record(settings)
  record.set('code', 'crm'); record.set('default_view', 'kanban'); app.save(record)
}, () => { throw new Error('CRM settings rollback refused: preserve multiple market classifications.') })
