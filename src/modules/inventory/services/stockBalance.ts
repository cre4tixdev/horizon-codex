import type { z } from 'zod'
import type { balanceSchema } from '../schemas/stock'

export function summarizeStock(rows: readonly z.infer<typeof balanceSchema>[]) {
  const totals = rows.reduce((total, row) => ({ physical: total.physical + row.physical, reserved: total.reserved + row.reserved, available: total.available + row.available }), { physical: 0, reserved: 0, available: 0 })
  return { physical: Math.round(totals.physical * 1_000_000) / 1_000_000, reserved: Math.round(totals.reserved * 1_000_000) / 1_000_000, available: Math.round(totals.available * 1_000_000) / 1_000_000 }
}
