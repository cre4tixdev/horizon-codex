// CRM remains the source of truth; both calendar and timeline read this projection.
module.exports = (event) => {
  const query = event.request.url.query(), dates = require(`${__hooks}/lib/tenders.js`)
  const from = dates.date(query.get('from'), true), to = dates.date(query.get('to'), true)
  if (from >= to || Date.parse(to) - Date.parse(from) > 370 * 86400000) throw new BadRequestError('Période du calendrier invalide (maximum un an).')
  if (!['all', 'tenders'].includes(query.get('scope') || 'all')) throw new BadRequestError('Filtres du calendrier invalides.')
  if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, false, 'crm')) return event.json(200, { items: [], periods: [] })
  const cases = require(`${__hooks}/lib/tender-cases.js`), { filter, parameters } = cases.filters(query)
  const tenders = event.app.findRecordsByFilter('crm_tenders', filter, '', 2001, 0, parameters)
  if (tenders.length > 2000) throw new BadRequestError('Trop de dossiers. Affinez les filtres du calendrier.')
  const items = [], periods = []
  for (const tender of tenders) {
    const record = cases.linked(event.app, tender) || tender
    const company = event.app.findRecordById('contacts_companies', record.getString('company'))
    const identity = { source_module: 'crm', source_entity: 'crm_tenders', source_record_id: tender.id, title: record.getString('title'), code: tender.getString('reference') || record.getString('opportunity_number'), company: company.getString('name'), href: `/crm/tenders/${tender.id}` }
    const append = (id, kind, start, end, allDay, timezone, location = '') => {
      if (Date.parse(start) >= Date.parse(to) || Date.parse(start) < Date.parse(from) && (!end || Date.parse(end) <= Date.parse(from))) return
      items.push({ ...identity, id, kind, start: new Date(start).toISOString(), end: end ? new Date(end).toISOString() : '', all_day: allDay, timezone, location })
    }
    const start = tender.getString('publication_date'), end = tender.getString('submission_deadline')
    for (const [field, kind, allDay] of [['publication_date', 'publication', true], ['submission_deadline', 'submission', false], ['expected_result_date', 'result', true]]) if (tender.getString(field)) append(`crm:${tender.id}:${kind}`, kind, tender.getString(field), '', allDay, tender.getString('timezone'))
    const appointments = event.app.findRecordsByFilter('crm_tender_appointments', 'tender = {:id} && status != "cancelled" && start < {:to} && (start >= {:from} || end > {:from})', 'start', 2001, 0, { id: tender.id, from: from.replace('T', ' '), to: to.replace('T', ' ') })
    if (appointments.length > 2000) throw new BadRequestError('Trop de rendez-vous. Réduisez la période.')
    for (const item of appointments) append(`crm:${item.id}`, item.getString('kind'), item.getString('start'), item.getString('end'), false, item.getString('timezone'), item.getString('location'))
    if (start && end && Date.parse(start) < Date.parse(to) && Date.parse(end) >= Date.parse(from) || items.some((item) => item.source_record_id === tender.id)) periods.push({ ...identity, id: tender.id, start: start ? new Date(start).toISOString() : '', end: end ? new Date(end).toISOString() : '' })
  }
  return event.json(200, { items: items.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id)), periods })
}
