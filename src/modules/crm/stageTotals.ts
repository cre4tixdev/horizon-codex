import type { Opportunity, StageChange } from './schemas/opportunities'
export type StageTotal = { stage: string; currency: string; count: number; amount: number }
/** Server totals cover every filtered result; local moves adjust only their original page rows. */
export function stageTotals(totals: StageTotal[], records: Opportunity[], drafts: Record<string, StageChange>): StageTotal[] {
  const result = totals.map((total) => ({ ...total }))
  function adjust(stage: string, currency: string, amount: number, count: number) {
    let item = result.find((total) => total.stage === stage && total.currency === currency)
    if (!item) { item = { stage, currency, amount: 0, count: 0 }; result.push(item) }
    item.amount += amount; item.count += count
  }
  Object.values(drafts).forEach((draft) => {
    const record = records.find((item) => item.id === draft.id)
    if (record && record.stage !== draft.stage) { adjust(record.stage, record.currency, -record.estimated_value, -1); adjust(draft.stage, record.currency, record.estimated_value, 1) }
  })
  return result.filter((total) => total.count > 0)
}
