import { quoteColumns, type Quote } from '../schemas/quotes'
export function visibleQuoteColumns(status?: Quote['status'], editable = false) {
  return quoteColumns.filter(([key]) => key === 'actions' ? status !== 'accepted' || editable : !['purchase', 'receipt', 'delivery', 'invoiced'].includes(key) || status === 'accepted')
}
const minimums: Record<string, number> = { position: 42, description: 120, brand: 45, reference: 55, quantity: 40, unit: 36, unit_cost: 70, unit_price: 70, margin_percent: 48, discount: 48, line_total: 82, purchase: 60, receipt: 60, delivery: 60, invoiced: 60, is_option: 42, actions: 58 }
const contentLimits = (input: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(minimums).map(([key, value]) => [key, Math.max(value, input[key] || 0)]))
const monetaryColumns = new Set(['unit_cost', 'unit_price', 'line_total'])
const compressionOrder = (keys: string[]) => [...keys.filter((key) => !monetaryColumns.has(key)), ...keys.filter((key) => monetaryColumns.has(key))]
export const quoteMinimumWidth = Object.values(minimums).reduce((sum, value) => sum + value, 0)
export function fitQuoteColumns(input: Record<string, number>, available: number, columns: ReadonlyArray<(typeof quoteColumns)[number]> = quoteColumns, contentMinimums: Record<string, number> = {}) {
  const limits = contentLimits(contentMinimums)
  const widths = Object.fromEntries(columns.map(([key, , fallback]) => [key, Math.max(limits[key]!, input[key] || fallback)]))
  const budget = Math.max(available, columns.reduce((sum, [key]) => sum + limits[key]!, 0))
  let excess = Object.values(widths).reduce((sum, value) => sum + value, 0) - budget
  if (excess < 0) widths.description! -= excess
  while (excess > 0.01) {
    const candidates = Object.keys(widths).filter((key) => widths[key]! > limits[key]! + 0.01)
    const text = candidates.filter((key) => !monetaryColumns.has(key))
    const flexible = text.length ? text : candidates
    if (!flexible.length) break
    const share = excess / flexible.length
    for (const key of flexible) { const reduction = Math.min(share, widths[key]! - limits[key]!); widths[key]! -= reduction; excess -= reduction }
  }
  return widths
}
export function resizeQuoteColumn(current: Record<string, number>, key: string, delta: number, columns: ReadonlyArray<(typeof quoteColumns)[number]> = quoteColumns, contentMinimums: Record<string, number> = {}) {
  const limits = contentLimits(contentMinimums)
  const widths = { ...current }, keys = columns.map(([name]) => name), index = keys.findIndex((name) => name === key)
  if (index < 0) return widths
  // Compress progressively in the drag direction, keeping the table width fixed.
  const others = keys.slice(index + 1)
  if (!others.length) return widths
  if (delta < 0) {
    let remaining = -delta
    for (const name of compressionOrder(keys.slice(0, index + 1).reverse())) {
      const amount = Math.min(remaining, Math.max(0, widths[name]! - limits[name]!))
      widths[name]! -= amount; remaining -= amount
      if (remaining <= 0) break
    }
    widths[others[0]!]! += -delta - remaining
  } else {
    const growth = Math.min(delta, 10000 - widths[key]!)
    let remaining = growth
    for (const name of compressionOrder(others)) {
      const amount = Math.min(remaining, Math.max(0, widths[name]! - limits[name]!))
      widths[name]! -= amount; remaining -= amount
      if (remaining <= 0) break
    }
    // Stop at the available space: resizing never grows the table.
    widths[key]! += growth - remaining
  }
  return widths
}
export function quoteVisibleIndices(kinds: readonly string[], ids: readonly string[], folded: ReadonlySet<string>) {
  let hiddenLevel = 0
  return kinds.flatMap((kind, index) => {
    const level = ['section', 'subsection', 'subsection3'].indexOf(kind) + 1
    if (hiddenLevel && level && level <= hiddenLevel) hiddenLevel = 0
    if (hiddenLevel) return []
    if (level && folded.has(ids[index]!)) hiddenLevel = level
    return [index]
  })
}

export function quoteSectionEnd(kinds: readonly string[], index: number) {
  const level = ['section', 'subsection', 'subsection3'].indexOf(kinds[index] || '') + 1
  if (!level) return index + 1
  for (let next = index + 1; next < kinds.length; next++) {
    const nextLevel = ['section', 'subsection', 'subsection3'].indexOf(kinds[next]!) + 1
    if (nextLevel && nextLevel <= level) return next
  }
  return kinds.length
}
