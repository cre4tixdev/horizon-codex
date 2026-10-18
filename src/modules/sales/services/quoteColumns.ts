import { fitColumnWidths, resizeColumnWidths } from '../../../shared/ui/columnSizing'
import { quoteColumns, type Quote } from '../schemas/quotes'
export function visibleQuoteColumns(status?: Quote['status'], editable = false) {
  return quoteColumns.filter(([key]) => key === 'actions' ? status !== 'accepted' || editable : !['purchase', 'receipt', 'delivery', 'invoiced'].includes(key) || status === 'accepted')
}
const minimums: Record<string, number> = { position: 42, description: 120, brand: 45, reference: 55, quantity: 40, unit: 36, unit_cost: 70, unit_price: 70, margin_percent: 48, discount: 48, line_total: 82, purchase: 60, receipt: 60, delivery: 60, invoiced: 60, is_option: 42, actions: 58 }
const monetaryColumns = new Set(['unit_cost', 'unit_price', 'line_total'])
const definitions = (columns: ReadonlyArray<(typeof quoteColumns)[number]>, content: Record<string, number>) => columns.map(([id, , fallback]) => ({ id, fallback, minimum: Math.max(minimums[id]!, content[id] || 0), monetary: monetaryColumns.has(id) }))
export const quoteMinimumWidth = Object.values(minimums).reduce((sum, value) => sum + value, 0)
export function fitQuoteColumns(input: Record<string, number>, available: number, columns: ReadonlyArray<(typeof quoteColumns)[number]> = quoteColumns, contentMinimums: Record<string, number> = {}) {
  return fitColumnWidths(input, available, definitions(columns, contentMinimums), 'description')
}
export function resizeQuoteColumn(current: Record<string, number>, key: string, delta: number, columns: ReadonlyArray<(typeof quoteColumns)[number]> = quoteColumns, contentMinimums: Record<string, number> = {}) {
  return resizeColumnWidths(current, key, delta, definitions(columns, contentMinimums))
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
