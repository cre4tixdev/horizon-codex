const c = require(`${__hooks}/lib/purchasing-common.js`)
const stock = require(`${__hooks}/lib/stock-operations.js`)
const json = (record) => JSON.parse(record.getString('lines') || '[]')
const round = (value) => Math.round(value * 1000000) / 1000000
module.exports = {
  plan(app, user, order, previous, next) {
    const rights = c.policy.permissions(app, user), canRead = rights.includes('inventory.read'), operations = app.findRecordsByFilter('inventory_operations', 'sales_quote = {:id} || origin.sales_quote = {:id}', 'created,id', 0, 0, { id: order.getString('quote') }), reservations = app.findRecordsByFilter('inventory_reservations', 'order = {:id}', 'created,id', 0, 0, { id: order.id })
    const result = { blocks: [], impacts: [], operations: [], reservations: [], versions: { operations: operations.map((record) => record.publicExport()), reservations: reservations.map((record) => record.publicExport()) } }
    const budget = new Map(), reserveBudget = new Map(), removed = new Set(), replaced = new Set()
    const block = (old, record, message, reservation = false) => result.blocks.push({ message: canRead ? `Ligne ${old.position} · ${message}` : 'Un engagement Stock empêche cette modification. Consultez un gestionnaire Stock.', href: canRead ? reservation ? `/inventory/operations?sales_quote=${order.getString('quote')}` : `/inventory/operations/${record.id}` : '', label: canRead ? reservation ? 'Réservations' : require(`${__hooks}/lib/stock-operation-number.js`)(app, record) : 'Stock' })
    for (const old of previous) {
      const value = next.find((line) => line.id === old.id), identityChanged = !value || ['product', 'unit', 'kind'].some((key) => value[key] !== old[key])
      const linked = operations.find((record) => record.getString('status') !== 'cancelled' && !(record.getString('status') === 'draft' && ['OUT', 'PREP'].includes(record.getString('kind'))) && json(record).some((line) => (line.sales_line || line.source_line) === old.record_id)), held = reservations.find((record) => record.getString('order_line') === old.record_id)
      if (identityChanged && (linked || held)) { block(old, linked || held, linked ? 'le produit, l’unité et la ligne doivent être conservés avec leur historique réalisé.' : 'la ligne et son produit portent un historique de réservation ; conservez la ligne avec une quantité nulle pour la retirer.', !linked); continue }
      if (!value) { removed.add(old.record_id); continue }
      if (identityChanged) replaced.add(old.record_id)
      const delivered = stock.deliveryTracking(app, order.getString('quote'), old.record_id).delivered
      if (value.quantity + 0.000001 < delivered) { block(old, linked, `quantité inférieure aux ${delivered} unités nettes déjà livrées.`); continue }
      budget.set(old.record_id, round(Math.max(0, value.quantity - delivered)))
      const pending = Math.max(0, c.requested(app, old.record_id) - require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, old.record_id))
      reserveBudget.set(old.record_id, round(Math.max(0, value.quantity - delivered - pending)))
    }
    for (const record of reservations.filter((item) => item.getBool('active'))) {
      const remaining = reserveBudget.get(record.getString('order_line'))
      if (remaining === undefined) continue
      const quantity = Math.min(record.getFloat('quantity'), remaining)
      reserveBudget.set(record.getString('order_line'), round(remaining - quantity))
      if (quantity === record.getFloat('quantity')) continue
      if (!rights.includes('inventory.stock.reserve') || !canRead) { result.blocks.push({ message: 'Droits de réservation Stock nécessaires pour réduire les réservations liées.', href: '', label: 'Réservations' }); continue }
      result.reservations.push({ id: record.id, quantity })
      result.impacts.push({ message: `Réservation : ${record.getFloat('quantity')} → ${quantity}`, href: `/inventory/operations?sales_quote=${order.getString('quote')}`, label: 'Réservations' })
    }
    for (const record of operations.filter((item) => item.getString('status') === 'draft' && ['OUT', 'PREP'].includes(item.getString('kind')))) {
      const before = json(record), changed = before.map((line) => {
        const id = line.sales_line || line.source_line, remaining = budget.get(id), value = next.find((item) => item.record_id === id)
        if (removed.has(id)) return null
        if (remaining === undefined || !value) return line
        let current = line
        if (replaced.has(id)) {
          if (!value.product || value.kind !== 'item') return null
          const product = c.get(app, 'inventory_products', value.product)
          if (product.getString('stock_policy') === 'none') return null
          current = { ...line, product: value.product, unit: value.unit, brand: product.getString('manufacturer'), reference: product.getString('sku'), tracking: product.getString('tracking'), traces: [] }
        }
        const quantity = Math.min(line.quantity, remaining); budget.set(id, round(remaining - quantity))
        const traces = quantity !== line.quantity && (current.traces || []).reduce((sum, trace) => sum + trace.quantity, 0) > quantity ? [] : current.traces
        return { ...current, quantity, planned_quantity: quantity, description: value.description, unit_cost: value.unit_cost, traces, allocations: (line.allocations || []).map((allocation) => ({ ...allocation, quantity: line.quantity ? round(allocation.quantity * quantity / line.quantity) : 0 })) }
      }).filter((line) => line && (!line.product || line.quantity > 0))
      if (c.hash(before) === c.hash(changed)) continue
      if (!canRead || !rights.includes('inventory.write')) { result.blocks.push({ message: 'Droits de gestion Stock nécessaires pour ajuster les bons brouillons liés.', href: '', label: 'Stock' }); continue }
      result.operations.push({ id: record.id, lines: changed, cancel: !changed.some((line) => line.product && line.quantity > 0) })
      result.impacts.push({ message: `${require(`${__hooks}/lib/stock-operation-number.js`)(app, record)} : ${changed.some((line) => line.product && line.quantity > 0) ? 'lignes et quantités brouillon ajustées ; vérifier les lots/séries si produit ou quantité modifiés' : 'brouillon annulé et archivé, historique conservé'}`, href: `/inventory/operations/${record.id}`, label: require(`${__hooks}/lib/stock-operation-number.js`)(app, record) })
    }
    return result
  },
  apply(app, user, plan) {
    for (const change of plan.reservations) {
      const record = c.get(app, 'inventory_reservations', change.id), before = record.publicExport()
      if (change.quantity) record.set('quantity', change.quantity); else record.set('active', false)
      app.save(record); c.policy.audit(app, 'inventory_reservations', record.id, user.id, before, record.publicExport(), 'update')
    }
    for (const change of plan.operations) {
      const record = c.get(app, 'inventory_operations', change.id), before = record.publicExport()
      if (change.cancel) { record.set('status', 'cancelled'); record.set('archived_at', new Date().toISOString()) } else record.set('lines', change.lines)
      app.save(record); c.audit(app, user, record, before, 'Brouillon ajusté après révision de commande')
    }
  },
}
