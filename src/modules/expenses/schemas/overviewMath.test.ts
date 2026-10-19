import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { expensePeriod, type ExpenseOverviewCell } from './expenses'
const math = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/expenses-overview-math.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { period: (view: string, month: string) => { start: string; end: string; periods: string[] } | null; cell: (month: string, reports: ExpenseOverviewCell['reports'], today: string, start: string, end: string) => ExpenseOverviewCell }
describe('Expense period overview', () => {
  it('aligns calendar quarters and years, including navigation across December', () => {
    expect(math.period('quarter', '2026-11')?.periods).toEqual(['2026-10', '2026-11', '2026-12'])
    expect(math.period('year', '2026-11')?.periods).toHaveLength(12)
    expect(expensePeriod('2026-11', 'quarter', 1)).toBe('2027-01')
    expect(expensePeriod('2026-01', 'year', -1)).toBe('2025-01')
    expect(expensePeriod('2026-01', 'month', -1)).toBe('2025-12')
    expect(math.period('week', '2026-01')).toBeNull(); expect(math.period('month', '2026-13')).toBeNull()
  })
  it('distinguishes no received note, future and dates outside employment without inventing lateness', () => {
    expect(math.cell('2026-10', [], '2026-10', '', '').status).toBe('missing')
    expect(math.cell('2026-12', [], '2026-10', '', '').status).toBe('future')
    expect(math.cell('2026-10', [], '2026-10', '2026-11-01', '').status).toBe('off')
    expect(math.cell('2026-10', [], '2026-10', '', '2026-09-30').status).toBe('off')
  })
  it('keeps complements and all statuses, sums cents once and excludes cancelled notes', () => {
    const reports: ExpenseOverviewCell['reports'] = [{ id: 'a', status: 'validated', total: .1, supplement: false }, { id: 'b', status: 'submitted', total: .2, supplement: true }, { id: 'c', status: 'cancelled', total: 999, supplement: true }]
    const cell = math.cell('2026-10', reports, '2026-10', '', '')
    expect(cell.total).toBe(.3); expect(cell.status).toBe('mixed'); expect(cell.reports).toHaveLength(3)
  })
})
