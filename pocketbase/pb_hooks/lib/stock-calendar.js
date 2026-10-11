// Calendar consumes an Inventory projection, with Inventory permissions applied first.
module.exports = (event, from, to) => {
  const policy = require(`${__hooks}/lib/access-policy.js`), query = event.request.url.query()
  if (!policy.permissions(event.app, event.auth).includes('inventory.read') || query.get('scope') === 'tenders' || ['company', 'owner', 'preparation_status', 'tag'].some((field) => query.get(field))) return []
  const status = query.get('status') || ''; if (status && !['draft', 'counting', 'done', 'cancelled'].includes(status)) return []
  const params = { from: from.slice(0, 10), to: to.slice(0, 10), q: (query.get('q') || '').slice(0, 200), status }
  const rows = event.app.findRecordsByFilter('inventory_operations', 'kind = "INV" && planned_date >= {:from} && planned_date <= {:to} && status != "cancelled"' + (query.get('state') === 'archived' ? ' && archived_at != ""' : ' && archived_at = ""') + (params.q ? ' && (number ~ {:q} || title ~ {:q})' : '') + (status ? ' && status = {:status}' : ''), 'planned_date', 2001, 0, params)
  if (rows.length > 2000) throw new BadRequestError('Affinez le calendrier des inventaires.')
  return rows.map((record) => ({ id: `inventory:${record.id}`, source_module: 'inventory', source_entity: 'inventory_operations', source_record_id: record.id, kind: 'inventory', title: record.getString('title') || (record.getString('inventory_mode') === 'annual' ? 'Inventaire annuel' : 'Inventaire tournant'), code: record.getString('number'), company: '', start: `${record.getString('planned_date')}T00:00:00.000Z`, end: '', all_day: true, timezone: 'Europe/Paris', location: event.app.findRecordById('inventory_warehouses', record.getString('warehouse')).getString('name'), href: `/inventory/operations/${record.id}` }))
}
