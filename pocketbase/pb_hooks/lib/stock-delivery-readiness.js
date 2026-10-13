const round = (value) => Math.round(value * 1000000) / 1000000
const items = (record) => JSON.parse(record.getString('lines') || '[]')
const delivery = (record) => record.getString('kind') === 'OUT' && record.getString('sales_quote') && !record.getBool('dropship') && !record.getBool('internal_use') && !record.getBool('scrap')
const key = (product, location, identity = '') => `${product}/${location}/${identity}`
module.exports = {
  delivery,
  // Four bounded aggregate reads for a page, with explicit joins and bound IDs.
  context(app, records) {
    const selected = records.filter(delivery).flatMap(items).filter((line) => line.product && line.from_location)
    const products = [...new Set(selected.map((line) => line.product))], locations = [...new Set(selected.map((line) => line.from_location))]
    const physical = new Map(), reserved = new Map(), own = new Map()
    if (products.length + locations.length > 10000) throw new BadRequestError('Affinez les livraisons avant de calculer autant de disponibilités.')
    if (!products.length) return { physical, reserved, own }
    const params = { today: new DateTime().time().in(new Timezone('Europe/Paris')).format('2006-01-02') }
    const bind = (values, prefix) => values.map((id, index) => { params[prefix + index] = id; return '{:' + prefix + index + '}' }).join(',')
    const productIds = bind(products, 'p'), locationIds = bind(locations, 'l')
    const where = `r.product IN (${productIds}) AND r.location IN (${locationIds})`
    const valid = `((r.lot = '' AND r.serial = '') OR (lot.status = 'active' AND (lot.expiry_date = '' OR lot.expiry_date >= {:today})) OR serial.status = 'stock')`
    const query = (sql) => { const rows = arrayOf(new DynamicModel({ product: '', location: '', identity: '', order_line: '', quantity: 0.1 })); app.db().newQuery(sql).bind(params).all(rows); return rows }
    for (const row of query(`SELECT r.product, r.location, '' AS identity, '' AS order_line, SUM(r.quantity) AS quantity FROM inventory_moves r WHERE ${where} GROUP BY r.product, r.location`)) physical.set(key(row.product, row.location), row.quantity)
    for (const row of query(`SELECT r.product, r.location, COALESCE(NULLIF(r.lot,''),r.serial) AS identity, '' AS order_line, SUM(r.quantity) AS quantity FROM inventory_trace_moves r LEFT JOIN inventory_lots lot ON lot.id = r.lot LEFT JOIN inventory_serials serial ON serial.id = r.serial WHERE ${where} AND ${valid} GROUP BY r.product,r.location,r.lot,r.serial`)) physical.set(key(row.product, row.location, row.identity), row.quantity)
    for (const row of query(`SELECT r.product,r.location,COALESCE(NULLIF(r.lot,''),r.serial) AS identity,r.order_line,SUM(r.quantity) AS quantity FROM inventory_reservations r LEFT JOIN inventory_lots lot ON lot.id = r.lot LEFT JOIN inventory_serials serial ON serial.id = r.serial WHERE ${where} AND r.active = true AND ${valid} GROUP BY r.product,r.location,r.lot,r.serial,r.order_line`)) {
      const id = key(row.product, row.location, row.identity)
      reserved.set(id, (reserved.get(id) || 0) + row.quantity); own.set(`${id}/${row.order_line}`, row.quantity)
    }
    // Inactive locations cannot contribute to readiness.
    const active = new Set(query(`SELECT '' AS product,r.id AS location,'' AS identity,'' AS order_line,0 AS quantity FROM inventory_locations r JOIN inventory_warehouses w ON w.id = r.warehouse WHERE r.id IN (${locationIds}) AND r.active = true AND w.active = true`).map((row) => row.location))
    return { physical, reserved, own, active }
  },
  project(record, context) {
    if (!delivery(record)) return null
    const used = new Map(), usedOwn = new Map(), done = record.getString('status') === 'done'
    const lines = items(record).filter((line) => line.product).map((line) => {
      const planned = line.planned_quantity ?? line.quantity
      if (done) return { id: line.id, planned, ready: line.quantity, quantity: line.quantity, unit: line.unit }
      let ready = 0
      if (context.active?.has(line.from_location)) {
        const base = `${line.product}/${line.from_location}`, source = line.sales_line || line.source_line
        const identities = line.tracking && line.tracking !== 'none' ? line.traces?.length ? line.traces.map((trace) => ({ id: trace.lot || trace.serial, cap: trace.quantity })) : [...context.physical.keys()].filter((id) => id.startsWith(base + '/') && id !== base + '/').map((id) => ({ id: id.slice(base.length + 1), cap: Infinity })) : [{ id: '', cap: Infinity }]
        for (const identity of identities) {
          const id = key(line.product, line.from_location, identity.id), ownId = `${id}/${source}`
          const free = Math.max(0, (context.physical.get(id) || 0) - (context.reserved.get(id) || 0) - (used.get(id) || 0))
          const own = Math.max(0, (context.own.get(ownId) || 0) - (usedOwn.get(ownId) || 0))
          const portion = Math.max(0, Math.min(line.quantity - ready, identity.cap, free + own)), owned = Math.min(portion, own)
          ready += portion; usedOwn.set(ownId, (usedOwn.get(ownId) || 0) + owned); used.set(id, (used.get(id) || 0) + portion - owned)
        }
      }
      return { id: line.id, planned, quantity: line.quantity, ready: round(ready), unit: line.unit }
    })
    const units = new Set(lines.map((line) => line.unit)), homogeneous = units.size === 1
    return { lines, ready: homogeneous ? round(lines.reduce((sum, line) => sum + line.ready, 0)) : lines.filter((line) => line.ready + 0.000001 >= (done ? line.planned : line.quantity)).length, required: homogeneous ? round(lines.reduce((sum, line) => sum + (done ? line.planned : line.quantity), 0)) : lines.length, unit: homogeneous ? lines[0]?.unit || '' : 'lignes', complete: lines.length > 0 && lines.every((line) => line.ready + 0.000001 >= (done ? line.planned : line.quantity)) }
  },
}
