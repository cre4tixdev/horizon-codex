import type { QuoteLineInput } from '../schemas/quotes'
export function kitEnd(lines: readonly Partial<QuoteLineInput>[], index: number) {
  const key = lines[index]?.kit_key
  if (!key) return index + 1
  let end = index + 1
  while (end < lines.length && lines[end]?.kit_parent === key) end++
  return end
}
export function copyKitRows(lines: readonly QuoteLineInput[]): QuoteLineInput[] {
  const keys = new Map(lines.filter((line) => line.kit_key).map((line) => [line.kit_key!, crypto.randomUUID()]))
  return lines.map((line) => ({ ...line, id: undefined, ...(line.kit_key ? { kit_key: keys.get(line.kit_key)! } : {}), ...(line.kit_parent ? { kit_parent: keys.get(line.kit_parent) || line.kit_parent } : {}) }))
}
export function moveKitRows(lines: QuoteLineInput[], from: number, to: number): QuoteLineInput[] {
  const source = lines[from], target = lines[to]
  if (!source || !target || from === to) return lines
  if (source.kit_parent) {
    if (target.kit_parent !== source.kit_parent) return lines
    const result = [...lines]; result.splice(to, 0, result.splice(from, 1)[0]!); return result
  }
  const parent = target.kit_parent ? lines.findIndex((line) => line.kit_key === target.kit_parent) : to
  const end = kitEnd(lines, from), length = end - from
  let destination = from < to ? kitEnd(lines, parent) : parent
  if (destination >= from && destination <= end) return lines
  const result = [...lines], moved = result.splice(from, length)
  if (destination > from) destination -= length
  result.splice(destination, 0, ...moved); return result
}
export function previewKitRows(input: readonly Partial<QuoteLineInput>[]): Partial<QuoteLineInput>[] {
  return input.map((line) => {
    if (line.kit_key) return { ...line, unit_cost: Math.round(input.filter((child) => child.kit_parent === line.kit_key).reduce((sum, child) => sum + (child.kit_quantity || 0) * (child.unit_cost || 0), 0) * 1e6) / 1e6 }
    if (!line.kit_parent) return line
    const parent = input.find((item) => item.kit_key === line.kit_parent)
    return { ...line, quantity: Math.round((parent?.quantity || 0) * (line.kit_quantity || 0) * 1e6) / 1e6, unit_price: 0, discount: 0, price_source: 'manual', margin_percent: 0, is_option: Boolean(parent?.is_option) }
  })
}
