/** Preview in cents; TaxService rechecks the persisted TTC and VAT on the server. */
export function expenseTax(value: number, rate: number, basis: 'net' | 'gross') {
  if (!Number.isFinite(value) || value < 0 || value > 10000000 || !Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error('Montant ou taux de TVA invalide.')
  const cents = Math.round(value * 100)
  const gross = basis === 'gross' ? cents : Math.round(cents * (1 + rate / 100))
  const net = basis === 'net' ? cents : Math.round(cents / (1 + rate / 100))
  if (gross > 1000000000) throw new Error('Montant TTC hors limites.')
  return { amount: gross / 100, tax_amount: (gross - net) / 100 }
}
