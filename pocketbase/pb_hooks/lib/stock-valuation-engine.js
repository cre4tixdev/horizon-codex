// Pure valuation engine. Six decimals for unit costs and quantities; cents at presentation.
const round = (n) => {
  const scaled = Math.round(n * 1000000)
  if (!Number.isSafeInteger(scaled)) throw new BadRequestError('Montant ou quantité trop élevé pour une valorisation précise.')
  return scaled / 1000000
}
const quantity = (layers) => round(layers.reduce((sum, layer) => sum + layer.quantity, 0))
const value = (layers) => round(layers.reduce((sum, layer) => sum + layer.quantity * layer.cost, 0))
const average = (layers) => quantity(layers) ? value(layers) / quantity(layers) : 0
const uniform = (layers, cost) => {
  const places = [...new Set(layers.map((layer) => layer.place))]
  return places.map((place) => ({ place, quantity: quantity(layers.filter((layer) => layer.place === place)), cost }))
}
const take = (layers, place, amount) => {
  let left = amount; const consumed = [], remaining = []
  for (const layer of layers) {
    const used = layer.place === place ? Math.min(left, layer.quantity) : 0
    if (used > 0) consumed.push({ ...layer, quantity: used })
    if (layer.quantity - used > 0.0000001) remaining.push({ ...layer, quantity: round(layer.quantity - used) })
    left = round(left - used)
  }
  if (left > 0.000001) throw new BadRequestError('Valeur de stock insuffisante : validez les valeurs d’ouverture avant de poursuivre.')
  return { layers: remaining, consumed }
}
const movement = (initial, method, standard, place, delta, actual, transferPlace = '', receiving = false, returned = []) => {
  let layers = initial.map((layer) => ({ ...layer })), consumed = [], movementValue = 0
  const before = value(layers)
  if (transferPlace) {
    const result = take(layers, receiving ? transferPlace : place, Math.abs(delta)); consumed = result.consumed
    layers = [...result.layers, ...consumed.map((layer) => ({ ...layer, place: receiving ? place : transferPlace }))]
    movementValue = value(consumed) * (receiving ? 1 : -1)
  } else if (delta < 0) {
    const result = take(layers, place, -delta); consumed = result.consumed; layers = result.layers; movementValue = -value(consumed)
  } else if (delta > 0) {
    const cost = method === 'standard' ? standard : actual
    if (!Number.isFinite(cost) || cost < 0) throw new BadRequestError('Renseignez le coût d’entrée en EUR.')
    layers.push(...(method === 'fifo' && returned.length ? returned.map((layer) => ({ ...layer, place })) : [{ place, quantity: delta, cost }]))
    movementValue = round(delta * cost)
    if (method === 'cump') layers = uniform(layers, average(layers))
    else if (method === 'standard') layers = uniform(layers, standard)
  }
  if (layers.length > 5000) throw new BadRequestError('Ce produit dépasse 5 000 couches de stock ; un traitement dédié est nécessaire.')
  return { layers, consumed, movementValue: round(movementValue), valueDelta: round(value(layers) - before) }
}
const change = (layers, method, standard) => {
  if (method === 'standard') return uniform(layers, standard)
  // A new method starts from the remaining value; it never rewrites previous entries.
  const cost = average(layers), places = [...new Set(layers.map((layer) => layer.place))]
  return places.map((place) => ({ place, quantity: quantity(layers.filter((layer) => layer.place === place)), cost }))
}
module.exports = { round, quantity, value, average, movement, change, uniform, take }
