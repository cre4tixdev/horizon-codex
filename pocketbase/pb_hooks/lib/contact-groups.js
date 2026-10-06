module.exports = (event, navigation = false) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth)) throw new ForbiddenError('Accès refusé.')
  const query = event.request.url.query()
  const kind = query.get('kind'); const grouping = query.get('group') || (navigation ? 'none' : ''); const state = query.get('state') || 'active'; const role = query.get('role') || 'all'
  const people = kind === 'people'
  const sorts = people ? ['last_name', 'email'] : ['name', 'email', 'legal_name']
  const sort = query.get('sort') || sorts[0]; const direction = query.get('direction') || 'asc'
  const page = Number(query.get('page') || 1); const text = String(query.get('q') || '').trim()
  if (!['companies', 'people'].includes(kind) || !['country', ...(people ? ['company'] : []), ...(navigation ? ['none'] : [])].includes(grouping) || !['active', 'archived'].includes(state) || !['all', 'customer', 'supplier'].includes(role) || !sorts.includes(sort) || !['asc', 'desc'].includes(direction) || !Number.isInteger(page) || page < 1 || page > 100000 || text.length > 200) throw new BadRequestError('Regroupement invalide.')
  const alias = people ? 'p' : 'c'
  const companyId = people ? 'p.company' : 'c.id'
  const country = `COALESCE((SELECT a.country FROM contacts_addresses a WHERE a.company = ${companyId} AND a.type = 'registered' AND (a.is_primary = 1 OR (SELECT COUNT(*) FROM contacts_addresses ax WHERE ax.company = ${companyId} AND ax.type = 'registered') = 1) ORDER BY a.is_primary DESC, a.created, a.id LIMIT 1), '')`
  const key = grouping === 'company' ? "COALESCE(c.id, '')" : country
  const label = grouping === 'company' ? "COALESCE(c.name, '')" : `COALESCE((SELECT label FROM settings_countries WHERE code = ${country}), ${country})`
  const params = { active: state === 'active', role, limit: 25, offset: (page - 1) * 25 }
  const conditions = [`${alias}.active = {:active}`]
  if (role !== 'all') conditions.push(`EXISTS (SELECT 1 FROM contacts_company_roles r WHERE r.company = ${companyId} AND r.role = {:role} AND r.active = 1)`)
  const fields = people ? ['p.first_name', 'p.last_name', 'p.email', 'c.name'] : ['c.name', 'c.legal_name', 'c.email']
  text.split(/\s+/).filter(Boolean).forEach((term, index) => {
    params[`term${index}`] = `%${term}%`
    conditions.push(`(${fields.map((field) => `${field} LIKE {:term${index}}`).join(' OR ')})`)
  })
  const from = people ? 'contacts_people p LEFT JOIN contacts_companies c ON c.id = p.company' : 'contacts_companies c'
  const base = `SELECT ${alias}.id AS id, ${key} AS group_key, ${label} AS group_label, ${alias}.${sort} AS sort_value FROM ${from} WHERE ${conditions.join(' AND ')}`
  if (navigation) {
    const id = query.get('id')
    if (!/^[a-zA-Z0-9]{15}$/.test(id)) throw new BadRequestError('Fiche invalide.')
    params.id = id
    const order = `${grouping === 'none' ? '' : 'group_label COLLATE NOCASE, group_key, '}sort_value${grouping === 'none' ? '' : ' COLLATE NOCASE'} ${direction.toUpperCase()}, id`
    const result = new DynamicModel({ position: 0, total: 0, previous: '', next: '' })
    const rows = arrayOf(new DynamicModel({ position: 0, total: 0, previous: '', next: '' }))
    event.app.runInTransaction((app) => {
      app.db().newQuery(`WITH matched AS (${base}), ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY ${order}) AS position, COUNT(*) OVER () AS total, COALESCE(LAG(id) OVER (ORDER BY ${order}), '') AS previous, COALESCE(LEAD(id) OVER (ORDER BY ${order}), '') AS next FROM matched) SELECT position, total, previous, next FROM ranked WHERE id = {:id}`).bind(params).all(rows)
      rows.forEach((row) => { result.position = row.position; result.total = row.total; result.previous = row.previous; result.next = row.next })
      if (!result.position) {
        const count = new DynamicModel({ total: 0 })
        app.db().newQuery(`WITH matched AS (${base}) SELECT COUNT(*) AS total FROM matched`).bind(params).one(count)
        result.total = count.total
      }
    })
    return event.json(200, result)
  }
  const rows = arrayOf(new DynamicModel({ id: '', group_key: '', group_label: '' }))
  const counts = arrayOf(new DynamicModel({ group_key: '', group_label: '', total: 0 }))
  // Counts and page come from the same snapshot; only 25 record ids leave the server.
  event.app.runInTransaction((app) => {
    app.db().newQuery(`WITH matched AS (${base}) SELECT group_key, group_label, COUNT(*) AS total FROM matched GROUP BY group_key ORDER BY group_label COLLATE NOCASE, group_key`).bind(params).all(counts)
    app.db().newQuery(`WITH matched AS (${base}) SELECT id, group_key, group_label FROM matched ORDER BY group_label COLLATE NOCASE, group_key, sort_value COLLATE NOCASE ${direction.toUpperCase()}, id LIMIT {:limit} OFFSET {:offset}`).bind(params).all(rows)
  })
  const totalItems = counts.reduce((sum, group) => sum + group.total, 0)
  const visibleKeys = new Set(rows.map((row) => row.group_key))
  return event.json(200, { items: rows, groups: counts.filter((group) => visibleKeys.has(group.group_key)), totalItems, totalPages: Math.ceil(totalItems / 25) })
}
