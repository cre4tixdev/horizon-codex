const c = require(`${__hooks}/lib/time-common.js`)
const catalog = require(`${__hooks}/lib/catalog-time.js`)
const resources = require(`${__hooks}/lib/hr-time-resources.js`)
const dto = (app, u, q = '') => {
  c.guard(app, u, 'settings')
  return { can_costs: c.can(app, u, 'costs'), activities: c.all(app, 'time_activities').map((r) => ({ id: r.id, product: r.getString('product'), label: catalog.identity(app, r.getString('product')).label, active: r.getBool('active'), work_types: c.json(r, 'work_types', []), valid_from: r.getString('valid_from'), valid_to: r.getString('valid_to'), updated: r.getString('updated') })), products: catalog.choices(app, q), employees: c.all(app, 'hr_employees', 'status = "active"', {}, 'last_name,first_name,id').map((r) => ({ id: r.id, label: `${r.getString('last_name')} ${r.getString('first_name')}` })), resources: resources.list(app, u) }
}
module.exports = {
  read(e) { return e.json(200, dto(e.app, e.auth, c.text(e.request.url.query().get('q') || '', 200))) },
  save(e) {
    const b = e.requestInfo().body; c.fields(b, ['area', 'input'])
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id); c.guard(app, u, 'settings')
      if (b.area === 'resources') return resources.save(app, u, b.input)
      if (b.area !== 'activities') throw new BadRequestError('Paramètres inconnus.')
      const i = b.input; c.fields(i, ['id', 'updated', 'product', 'active', 'work_types', 'valid_from', 'valid_to'])
      if (typeof i.active !== 'boolean' || !Array.isArray(i.work_types) || !i.work_types.length || new Set(i.work_types).size !== i.work_types.length || i.work_types.some((v) => !['be', 'production'].includes(v)) || i.valid_from && !c.math.valid(i.valid_from) || i.valid_to && !c.math.valid(i.valid_to) || i.valid_from && i.valid_to && i.valid_to < i.valid_from) throw new BadRequestError('Activité ou période invalide.')
      let r = i.id ? c.get(app, 'time_activities', i.id) : new Record(app.findCollectionByNameOrId('time_activities')), before = i.id ? r.publicExport() : null
      if (i.id && (r.getString('updated') !== i.updated || r.getString('product') !== i.product)) throw new ApiError(409, 'Activité modifiée ; rechargez les paramètres.')
      if (i.active) catalog.check(app, i.product)
      for (const key of ['product', 'active', 'work_types', 'valid_from', 'valid_to']) r.set(key, i[key] ?? '')
      c.save(app, r); require(`${__hooks}/lib/access-policy.js`).audit(app, 'time_activities', r.id, u.id, before, r.publicExport(), before ? 'update' : 'create')
    })
    return e.json(200, dto(e.app, e.auth))
  },
}
