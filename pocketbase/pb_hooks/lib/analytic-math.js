// Allocate historical line cents cumulatively so rounding cannot add or lose a cent.
const allocationCents = (total, quantities, quantity) => {
  const cents = Math.round(total * 100)
  if (!Number.isSafeInteger(cents) || !Number.isFinite(quantity) || quantity <= 0) throw new RangeError('Ventilation analytique hors limites.')
  let cumulative = 0, previous = 0
  return quantities.map((value) => {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Quantité de ventilation invalide.')
    cumulative += value
    const current = Math.round(cents * cumulative / quantity), portion = current - previous
    if (!Number.isSafeInteger(current)) throw new RangeError('Montant analytique hors limites.')
    previous = current
    return portion
  })
}
module.exports = { allocationCents }
