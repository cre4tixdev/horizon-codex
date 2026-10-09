import { emptyQuoteLine, type QuoteLineInput } from '../schemas/quotes'
// Display preview only. PocketBase Pricing always recomputes persisted amounts.
export function quotePreview(input: readonly Partial<QuoteLineInput>[], discount = 0, mode: 'percent' | 'amount' = 'percent') {
  const optionSections: { level: number; is_option: boolean }[] = []
  const lines = input.map((input) => {
    const line = { ...emptyQuoteLine(input.kind), ...input }
    const level = ['section', 'subsection', 'subsection3'].indexOf(line.kind) + 1
    if (level) while (optionSections.length && optionSections[optionSections.length - 1]!.level >= level) optionSections.pop()
    const optionInherited = optionSections.some((section) => section.is_option)
    line.is_option ||= optionInherited
    if (level) optionSections.push({ level, is_option: line.is_option })
    if (line.price_source === 'margin') line.unit_price = Math.round((line.unit_cost || 0) * (1 + (line.margin_percent || 0) / 100) * 1e6) / 1e6
    else line.margin_percent = line.unit_cost > 0 ? (line.unit_price / line.unit_cost - 1) * 100 : 0
    const total = line.kind === 'item' ? Math.round((line.quantity || 0) * (Math.round((line.unit_price || 0) * 1e6) / 1e6 * 100) * (1 - (line.discount || 0) / 100)) : 0
    return { ...line, optionInherited, line_total: total / 100, section_total: 0, section_options_total: 0, tax_base: total / 100 }
  })
  for (const [index, line] of lines.entries()) {
    if (!['section', 'subsection', 'subsection3'].includes(line.kind)) continue
    let base = 0, options = 0
    for (const next of lines.slice(index + 1)) {
      const level = (kind: string) => ['section', 'subsection', 'subsection3'].indexOf(kind) + 1
      if (level(next.kind) > 0 && level(next.kind) <= level(line.kind)) break
      if (next.is_option) options += Math.round(next.line_total * 100); else base += Math.round(next.line_total * 100)
    }
    line.section_total = base / 100; line.section_options_total = options / 100
  }
  const items = lines.filter((line) => line.kind === 'item' && !line.is_option)
  const cents = items.reduce((sum, line) => sum + Math.round(line.line_total * 100), 0)
  const costs = items.reduce((sum, line) => sum + Math.round((line.quantity || 0) * (Math.round((line.unit_cost || 0) * 1e6) / 1e6 * 100)), 0)
  const discountCents = mode === 'amount' ? Math.round((Number.isFinite(discount) ? discount : 0) * 100) : Math.round(cents * (Number.isFinite(discount) ? discount : 0) / 100), net = cents - discountCents
  let cumulative = 0, allocated = 0
  for (const line of items) {
    const amount = Math.round(line.line_total * 100)
    cumulative += amount
    const next = cents ? Math.round(discountCents * (cumulative / cents)) : 0
    line.tax_base = (amount - (next - allocated)) / 100
    allocated = next
  }
  return { lines, subtotal_before_discount: cents / 100, discount_amount: discountCents / 100, subtotal: net / 100, cost_total: costs / 100, margin_amount: (net - costs) / 100, margin_percent: costs > 0 ? (net - costs) / costs * 100 : 0, options_total: lines.filter((line) => line.is_option).reduce((sum, line) => sum + Math.round(line.line_total * 100), 0) / 100 }
}
export function quoteValidity(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
