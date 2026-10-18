export type ColumnSize = { id: string; minimum: number; fallback: number; monetary?: boolean }
const compressionOrder = (columns: ColumnSize[]) => [...columns.filter((column) => !column.monetary), ...columns.filter((column) => column.monetary)]
export function fitColumnWidths(input: Record<string, number>, available: number, columns: ColumnSize[], fill = columns[0]?.id) {
  const widths = Object.fromEntries(columns.map((column) => [column.id, Math.max(column.minimum, input[column.id] || column.fallback)]))
  const budget = Math.max(available, columns.reduce((sum, column) => sum + column.minimum, 0))
  let excess = Object.values(widths).reduce((sum, value) => sum + value, 0) - budget
  if (excess < 0 && fill && widths[fill] !== undefined) widths[fill] -= excess
  while (excess > 0.01) {
    const candidates = columns.filter((column) => widths[column.id]! > column.minimum + 0.01)
    const text = candidates.filter((column) => !column.monetary), flexible = text.length ? text : candidates
    if (!flexible.length) break
    const share = excess / flexible.length
    for (const column of flexible) { const reduction = Math.min(share, widths[column.id]! - column.minimum); widths[column.id]! -= reduction; excess -= reduction }
  }
  return widths
}
export function resizeColumnWidths(current: Record<string, number>, id: string, delta: number, columns: ColumnSize[]) {
  const widths = { ...current }, index = columns.findIndex((column) => column.id === id), others = columns.slice(index + 1)
  if (index < 0 || !others.length) return widths
  if (delta < 0) {
    let remaining = -delta
    for (const column of compressionOrder(columns.slice(0, index + 1).reverse())) {
      const amount = Math.min(remaining, Math.max(0, widths[column.id]! - column.minimum))
      widths[column.id]! -= amount; remaining -= amount
      if (remaining <= 0) break
    }
    widths[others[0]!.id]! += -delta - remaining
  } else {
    const growth = Math.min(delta, 10000 - widths[id]!)
    let remaining = growth
    for (const column of compressionOrder(others)) {
      const amount = Math.min(remaining, Math.max(0, widths[column.id]! - column.minimum))
      widths[column.id]! -= amount; remaining -= amount
      if (remaining <= 0) break
    }
    widths[id]! += growth - remaining
  }
  return widths
}
