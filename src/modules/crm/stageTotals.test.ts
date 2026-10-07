import { expect, it } from 'vitest'
import { stageTotals } from './stageTotals'
import { opportunityDraft, type Opportunity } from './schemas/opportunities'
it('keeps full filtered totals and currencies separate while previewing a local move', () => {
  const record: Opportunity = { ...opportunityDraft(), id: 'record000000001', collectionId: 'crm', title: 'Studio', stage: 'new', estimated_value: 12000, currency: 'EUR', opportunity_number: '00001', analytic_account: 'account00000001', estimated_margin: 12000, type: 'direct', active: true, created: '', updated: 'now' }
  const totals = [{ stage: 'new', currency: 'EUR', count: 110, amount: 20000 }, { stage: 'new', currency: 'USD', count: 2, amount: 1000 }]
  expect(stageTotals(totals, [record], { [record.id]: { id: record.id, stage: 'won', updated: 'now' } })).toEqual([{ stage: 'new', currency: 'EUR', count: 109, amount: 8000 }, { stage: 'new', currency: 'USD', count: 2, amount: 1000 }, { stage: 'won', currency: 'EUR', count: 1, amount: 12000 }])
  expect(totals[0]?.amount).toBe(20000)
})
