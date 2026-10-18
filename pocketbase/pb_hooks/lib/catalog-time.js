// Catalogue-owned eligibility and minimal identities, without prices or stock.
const c = require(`${__hooks}/lib/time-common.js`)
const eligible = (r) => r.getBool('active') && !r.getString('merged_into') && r.getString('kind') === 'service' && require(`${__hooks}/lib/catalog-sales-policy.js`).internalService(r)
module.exports = {
  check(app, id) { const r = c.get(app, 'inventory_products', id); if (!eligible(r)) throw new BadRequestError('Choisissez un service interne actif du catalogue.'); return r },
  choices(app, q = '') { return c.all(app, 'inventory_products', 'active = true && merged_into = "" && kind = "service" && manufacturer ~ "CVS" && (name ~ {:q} || sku ~ {:q})', { q }, 'name,id', 101).filter(eligible).slice(0, 100).map((r) => ({ id: r.id, label: `${r.getString('sku')} · ${r.getString('name')}` })) },
  identity(app, id) { const r = c.get(app, 'inventory_products', id); return { id: r.id, label: r.getString('name'), code: r.getString('sku') } },
}
