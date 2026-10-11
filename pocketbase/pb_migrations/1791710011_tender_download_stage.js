migrate((app) => {
  if (app.findRecordsByFilter('crm_tender_statuses', 'code = "to_download"', '', 1).length) return
  const analysis = app.findFirstRecordByFilter('crm_tender_statuses', 'code = "todo"')
  const order = analysis.getInt('sort_order')
  for (const stage of app.findRecordsByFilter('crm_tender_statuses', 'sort_order >= {:order}', '', 0, 0, { order })) {
    stage.set('sort_order', stage.getInt('sort_order') + 10); app.save(stage)
  }
  const stage = new Record(app.findCollectionByNameOrId('crm_tender_statuses'))
  for (const [field, value] of Object.entries({ code: 'to_download', label: 'À télécharger', tone: 'navy', color: '#7B8794', sort_order: order, active: true })) stage.set(field, value)
  app.save(stage)
}, (app) => {
  const stage = app.findFirstRecordByFilter('crm_tender_statuses', 'code = "to_download"')
  if (app.findRecordsByFilter('crm_tenders', 'status = {:id}', '', 1, 0, { id: stage.id }).length) throw new Error('Rollback refused: tenders use the download stage. Restore a coherent backup.')
  const order = stage.getInt('sort_order'); app.delete(stage)
  for (const record of app.findRecordsByFilter('crm_tender_statuses', 'sort_order >= {:order}', '', 0, 0, { order: order + 10 })) {
    record.set('sort_order', record.getInt('sort_order') - 10); app.save(record)
  }
})
