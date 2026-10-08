import { quoteColumns } from '../schemas/quotes'
const minimums: Record<string, number> = { position: 42, description: 120, brand: 45, reference: 55, quantity: 40, unit: 36, unit_cost: 70, unit_price: 70, margin_percent: 48, discount: 48, line_total: 82, purchase: 55, is_option: 42, actions: 58 }
export const quoteMinimumWidth = Object.values(minimums).reduce((sum, value) => sum + value, 0)
export function fitQuoteColumns(input: Record<string, number>, available: number) {
  const widths = Object.fromEntries(quoteColumns.map(([key, , fallback]) => [key, Math.max(minimums[key]!, input[key] || fallback)]))
  const budget = Math.max(available, quoteMinimumWidth)
  let excess = Object.values(widths).reduce((sum, value) => sum + value, 0) - budget
  if (excess < 0) widths.description! -= excess
  while (excess > 0.01) {
    const flexible = Object.keys(widths).filter((key) => widths[key]! > minimums[key]! + 0.01)
    if (!flexible.length) break
    const share = excess / flexible.length
    for (const key of flexible) { const reduction = Math.min(share, widths[key]! - minimums[key]!); widths[key]! -= reduction; excess -= reduction }
  }
  return widths
}
export function resizeQuoteColumn(current: Record<string, number>, key: string, delta: number) {
  const widths = { ...current }, keys = quoteColumns.map(([name]) => name), index = keys.findIndex((name) => name === key)
  const others = [...keys.slice(index + 1), ...keys.slice(0, index).reverse()]
  if (delta < 0) { const amount = Math.min(-delta, widths[key]! - minimums[key]!); widths[key]! -= amount; widths[others[0]!]! += amount }
  else for (const name of others) { const amount = Math.min(delta, widths[name]! - minimums[name]!); widths[name]! -= amount; widths[key]! += amount; delta -= amount; if (delta <= 0) break }
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
