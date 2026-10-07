migrate((app) => {
  const stages = app.findCollectionByNameOrId('crm_stages')
  stages.createRule = null
  app.save(stages)
  for (const name of ['crm_stages', 'crm_market_types']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.add(new TextField({ name: 'color', max: 7, pattern: '^#[0-9a-fA-F]{6}$' }))
    app.save(collection)
  }
  const codes = { new: 'open', qualified: 'open', won: 'won', completed: 'completed', lost: 'lost', cancelled: 'cancelled' }
  const targets = {}
  for (const code of Object.keys(codes)) {
    const record = app.findFirstRecordByFilter(stages, 'code = {:code}', { code })
    record.set('active', true); record.set('status', codes[code]); app.save(record); targets[code] = record.id
  }
  for (const stage of app.findAllRecords(stages)) {
    if (Object.hasOwn(codes, stage.getString('code'))) continue
    for (const record of app.findRecordsByFilter('crm_opportunities', 'stage = {:id}', '', 0, 0, { id: stage.id })) {
      const state = record.getString('status')
      record.set('stage', targets[state === 'open' ? 'qualified' : state]); app.save(record)
    }
    stage.set('active', false); app.save(stage)
  }
}, () => { throw new Error('CRM stage rollback refused: preserve fixed pipeline and custom colors.') })
