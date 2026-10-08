// Draft HT pricing. Official tax and validation snapshots remain future services.
module.exports = {
  quoteLines(input, discount = 0, mode = 'percent') {
    if (typeof discount !== 'number' || !Number.isFinite(discount) || discount < 0 || !['percent', 'amount'].includes(mode) || mode === 'percent' && discount > 100 || discount > 1000000000) throw new BadRequestError('Remise globale invalide.')
    if (!Array.isArray(input) || input.length > 200) throw new BadRequestError('Maximum 200 lignes par devis.')
    let cents = 0, options = 0, costs = 0
    const optionSections = []
    const lines = input.map((line, index) => {
      const kind = line.kind || 'item', description = String(line.description || '').trim(), unit = String(line.unit || '').trim(), brand = String(line.brand || '').trim(), reference = String(line.reference || '').trim()
      if (!['item', 'section', 'subsection', 'subsection3', 'note'].includes(kind) || !description || description.length > 2000 || unit.length > 40 || brand.length > 160 || reference.length > 160) throw new BadRequestError('Description ou type de ligne invalide.')
      for (const name of ['is_option', 'show_total']) if (line[name] !== undefined && typeof line[name] !== 'boolean') throw new BadRequestError('Option de ligne invalide.')
      const level = ['section', 'subsection', 'subsection3'].indexOf(kind) + 1
      if (level) while (optionSections.length && optionSections[optionSections.length - 1].level >= level) optionSections.pop()
      const isOption = Boolean(line.is_option) || optionSections.some((section) => section.is_option)
      if (level) optionSections.push({ level, is_option: isOption })
      const base = { position: index + 1, kind, description, unit: '', brand: '', reference: '', quantity: 0, unit_price: 0, unit_cost: 0, margin_percent: 0, discount: 0, line_total: 0, cost_total: 0, section_total: 0, section_options_total: 0, is_option: isOption, show_total: ['section', 'subsection', 'subsection3'].includes(kind) && Boolean(line.show_total), price_source: 'manual' }
      if (kind !== 'item') return base
      const quantity = Number(line.quantity), cost = Number(line.unit_cost || 0), discount = Number(line.discount || 0)
      const source = line.price_source || 'manual', margin = Number(line.margin_percent || 0)
      if (!['manual', 'margin'].includes(source) || !Number.isFinite(margin) || margin < -100 || margin > 10000000000000 || source === 'margin' && Math.round(cost * 100) <= 0) throw new BadRequestError('Marge invalide ou coût absent.')
      const price = source === 'margin' ? Math.round(cost * 100) / 100 * (1 + margin / 100) : Number(line.unit_price)
      if (!Number.isFinite(quantity) || quantity < 0.001 || quantity > 1000000 || !Number.isFinite(price) || price < 0 || price > 1000000000 || !Number.isFinite(cost) || cost < 0 || cost > 1000000000 || !Number.isFinite(discount) || discount < 0 || discount > 100) throw new BadRequestError('Quantité, coût, prix ou remise de ligne invalide.')
      const unitCents = Math.round(price * 100), costCents = Math.round(cost * 100), lineCents = Math.round(quantity * unitCents * (1 - discount / 100)), lineCost = Math.round(quantity * costCents)
      if (![lineCents, lineCost, cents + lineCents, options + lineCents, costs + lineCost].every(Number.isSafeInteger)) throw new BadRequestError('Montant hors limites.')
      if (isOption) options += lineCents; else { cents += lineCents; costs += lineCost }
      return { ...base, unit, brand, reference, quantity, unit_price: unitCents / 100, unit_cost: costCents / 100, discount, price_source: source, margin_percent: source === 'margin' ? margin : costCents > 0 ? (unitCents / costCents - 1) * 100 : 0, line_total: lineCents / 100, cost_total: lineCost / 100, is_option: isOption }
    })
    for (const [index, line] of lines.entries()) {
      if (!['section', 'subsection', 'subsection3'].includes(line.kind)) continue
      let section = 0, sectionOptions = 0
      for (const next of lines.slice(index + 1)) {
        const level = (kind) => ['section', 'subsection', 'subsection3'].indexOf(kind) + 1
      if (level(next.kind) > 0 && level(next.kind) <= level(line.kind)) break
        if (next.kind === 'item') { if (next.is_option) sectionOptions += Math.round(next.line_total * 100); else section += Math.round(next.line_total * 100) }
      }
      line.section_total = section / 100; line.section_options_total = sectionOptions / 100
    }
    const discountCents = mode === 'amount' ? Math.round(discount * 100) : Math.round(cents * discount / 100)
    if (discountCents > cents) throw new BadRequestError('La remise dépasse le total HT.')
    const net = cents - discountCents
    let cumulative = 0, allocated = 0
    for (const line of lines) {
      const amount = Math.round(line.line_total * 100)
      if (line.kind !== 'item' || line.is_option) { line.tax_base = line.line_total; continue }
      cumulative += amount
      const next = cents ? Math.round(discountCents * (cumulative / cents)) : 0
      line.tax_base = (amount - (next - allocated)) / 100
      allocated = next
    }
    return { lines, discount, discount_mode: mode, discount_amount: discountCents / 100, subtotal_before_discount: cents / 100, subtotal: net / 100, options_total: options / 100, cost_total: costs / 100, margin_amount: (net - costs) / 100, margin_percent: costs > 0 ? (net - costs) / costs * 100 : 0 }
  },
}
