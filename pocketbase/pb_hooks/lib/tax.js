// Explicit draft rate. Future contextual tax-code resolution feeds this calculation.
module.exports = {
  expenseCodes(app) {
    const settings = app.findFirstRecordByFilter('settings_billing', '')
    return JSON.parse(settings.getString('tax_codes') || '[]').map(({ code, label, rate }) => ({ code, label, rate }))
  },
  expenseRate(app, input, existing) {
    const amount = module.exports.expense(input.amount, input.tax_amount)
    const code = input.tax_code ?? '', rate = input.tax_rate ?? 0
    if (typeof code !== 'string' || code.length > 40 || !Number.isFinite(rate) || rate < 0 || rate > 100) throw new BadRequestError('Code ou taux de TVA invalide.')
    if (!code) { if (rate !== 0) throw new BadRequestError('Choisissez un code TVA pour ce taux.'); return { ...amount, tax_code: '', tax_rate: 0 } }
    const historical = existing && existing.getString('tax_code') === code && existing.getFloat('tax_rate') === rate
    const configured = historical ? null : module.exports.expenseCodes(app).find((item) => item.code === code)
    if (!historical && (!configured || configured.rate !== rate)) throw new BadRequestError('Le taux de TVA a changé ou est inconnu. Sélectionnez à nouveau un taux.')
    const total = Math.round(amount.amount * 100), net = Math.round(total / (1 + rate / 100)), tax = (total - net) / 100
    if (Math.round(amount.tax_amount * 100) !== total - net) throw new BadRequestError('Le montant de TVA ne correspond pas au taux choisi. Recalculez les montants.')
    return { amount: total / 100, tax_amount: tax, tax_code: code, tax_rate: rate }
  },
  expense(amount, tax) {
    if (![amount, tax].every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10000000 && Math.abs(Math.round(v * 100) / 100 - v) < 0.000001) || tax > amount) throw new BadRequestError('Montant ou TVA invalide : deux décimales, TVA comprise dans le TTC.');
    return { amount: Math.round(amount * 100) / 100, tax_amount: Math.round(tax * 100) / 100 };
  },
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
