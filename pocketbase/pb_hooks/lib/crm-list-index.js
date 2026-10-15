// Server ordering for displayed relations; record bodies still use native API Rules.
module.exports = (event) => {
  const { query, params, conditions } = require(`${__hooks}/lib/crm-list-query.js`)(event)
  const rights = require(`${__hooks}/lib/access-policy.js`).permissions(event.app, event.auth)
  const values = {
    type: "CASE o.type WHEN 'tender' THEN 'AO' ELSE 'Directe' END",
    company: rights.includes('contacts.read') ? "COALESCE(c.name, '')" : "''",
    stage: "COALESCE((SELECT label FROM crm_stages WHERE id = o.stage), '')",
    owner: "COALESCE((SELECT name FROM core_users WHERE id = o.owner), '')",
    market_types: "COALESCE((SELECT GROUP_CONCAT(label, ' · ') FROM (SELECT m.label FROM crm_market_types m JOIN json_each(o.market_types) j ON j.value = m.id ORDER BY m.label)), '')",
  }
  const selected = require(`${__hooks}/lib/list-sorting.js`).selection(query.get('sort'), Object.keys(values), 'company')
  const page = Number(query.get('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1) throw new BadRequestError('Page CRM invalide.')
  const rows = arrayOf(new DynamicModel({ id: '', value: '' }))
  event.app.db().newQuery(`SELECT o.id, ${values[selected.field]} AS value FROM crm_opportunities o LEFT JOIN contacts_companies c ON c.id = o.company LEFT JOIN crm_tenders t ON t.opportunity = o.id WHERE ${conditions.join(' AND ')} LIMIT 10001`).bind(params).all(rows)
  if (rows.length > 10000) throw new BadRequestError('Affinez les filtres de la liste CRM.')
  rows.sort((a, b) => require(`${__hooks}/lib/list-sorting.js`).compare(a.value, b.value, selected.descending) || a.id.localeCompare(b.id))
  return event.json(200, { items: rows.slice((page - 1) * 100, page * 100).map((item) => ({ id: item.id })), totalItems: rows.length, totalPages: Math.ceil(rows.length / 100), page })
}
