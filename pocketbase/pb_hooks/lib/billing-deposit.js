// Upgrade only unambiguous draft quantities; never applied to validated records.
const upgrade = (app, kind, input) => {
  if (kind.endsWith('_credit') || input.invoice_kind !== 'deposit' || input.deposit_percent > 0 || !Array.isArray(input.lines)) return input
  if (input.lines.some((line) => !line || typeof line.description !== 'string')) return input
  const items = input.lines.filter((line) => line.kind === 'item'), sources = new Map()
  if (!items.length || items.some((line) => !line.source_order || !line.source_line)) return input
  const ratios = items.map((line) => {
    if (!sources.has(line.source_order)) sources.set(line.source_order, require(`${__hooks}/lib/billing-sources.js`).source(app, kind, line.source_order))
    const original = sources.get(line.source_order).lines.find((row) => row.id === line.source_line)
    return original?.quantity > 0 ? line.quantity / original.quantity * 100 : NaN
  })
  const percent = Number(ratios[0].toFixed(8))
  if (!(percent > 0 && percent <= 100) || !ratios.every((ratio) => Math.abs(ratio - percent) < 0.000001)) return input
  const prefix = /^Acompte \d+(?:[.,]\d+)? % · /u
  return { ...input, deposit_percent: percent, lines: input.lines.map((line) => line.kind === 'item' ? { ...line, quantity: line.quantity * 100 / percent, description: line.description.replace(prefix, '') } : line) }
}
module.exports = { upgrade, label: (percent) => `Acompte de ${String(percent).replace('.', ',')} %` }
