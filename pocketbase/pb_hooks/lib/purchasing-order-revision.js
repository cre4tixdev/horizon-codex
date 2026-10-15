const c = require(`${__hooks}/lib/purchasing-common.js`)
module.exports = (app, user, order, previous, next) => {
  const blocks = [], versions = [], canRead = c.policy.permissions(app, user).includes('purchasing.read')
  for (const old of previous) {
    const requests = app.findRecordsByFilter('purchasing_request_lines', 'source_line = {:id}', 'created,id', 0, 0, { id: old.record_id })
    if (!requests.length) continue
    const linked = requests.map((line) => ({ line, request: c.get(app, 'purchasing_requests', line.getString('request')) }))
    versions.push(...linked.map(({ line, request }) => ({ line: line.publicExport(), request: request.publicExport() })))
    const value = next.find((line) => line.id === old.id), active = linked.filter(({ request }) => request.getString('status') !== 'cancelled')
    const pending = Math.max(0, active.reduce((sum, { line }) => sum + line.getFloat('quantity'), 0) - require(`${__hooks}/lib/purchasing-stock-source.js`).receivedForSaleLine(app, old.record_id))
    const delivered = require(`${__hooks}/lib/stock-operations.js`).deliveryTracking(app, order.getString('quote'), old.record_id).delivered
    if (!value || ['kind', 'product', 'unit'].some((key) => value[key] !== old[key]) || value.quantity + 0.000001 < pending + delivered) {
      const request = (active[0] || linked[0]).request
      blocks.push({ message: canRead ? `Ligne ${old.position} : ajustez les achats encore attendus de ${request.getString('request_number')} avant cette modification ; les liens historiques sont conservés.` : 'Un engagement Achats empêche cette modification. Consultez un acheteur.', href: canRead ? `/purchasing/requests/${request.id}` : '', label: canRead ? request.getString('request_number') : 'Achats' })
    }
  }
  return { blocks, versions }
}
