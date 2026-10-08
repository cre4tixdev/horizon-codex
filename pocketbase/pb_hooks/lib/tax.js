// Explicit draft rate. Future contextual tax-code resolution feeds this calculation.
module.exports = {
  quote(lines, rate) {
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 100) throw new BadRequestError('Taux de TVA invalide.')
    let tax = 0
    const result = lines.map((line) => {
      const amount = line.kind === 'item' ? Math.round(Math.round((line.tax_base ?? line.line_total) * 100) * rate / 100) : 0
      if (!line.is_option) tax += amount
      if (!Number.isSafeInteger(tax)) throw new BadRequestError('TVA hors limites.')
      return { ...line, tax_rate: line.kind === 'item' ? rate : 0, tax_amount: amount / 100 }
    })
    return { lines: result, tax: tax / 100 }
  },
}
