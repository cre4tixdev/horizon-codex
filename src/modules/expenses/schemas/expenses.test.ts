import { describe, expect, it } from 'vitest'
import { emptyExpense, expenseInput, lineInputSchema, monthLabel } from './expenses'
describe('Expense inputs', () => {
  it('preserves a calendar month independently of the browser timezone', () => { expect(monthLabel('2026-10')).toBe('octobre 2026'); expect(monthLabel('2026-01')).toBe('janvier 2026'); expect(monthLabel('2026-13')).toBe('2026-13') })
  it('rejects a tax greater than the gross amount and negative money', () => { expect(lineInputSchema.safeParse({ ...emptyExpense('2026-10'), amount: 10, tax_amount: 11 }).success).toBe(false); expect(lineInputSchema.safeParse({ ...emptyExpense('2026-10'), amount: -1 }).success).toBe(false); expect(lineInputSchema.safeParse({ ...emptyExpense('2026-10'), amount: 12.5, tax_amount: 2.08 }).success).toBe(true) })
  it('keeps only editable fields when extracting a stored expense', () => { const input = { ...emptyExpense('2026-10'), amount: 20, guests: ['contact'], internal: true }, stored = { ...input, id: 'stored', analytic_account: 'protected', receipt: ['original.pdf'] }; expect(expenseInput(stored)).toEqual(input); expect(expenseInput(stored)).not.toHaveProperty('receipt'); expect(expenseInput(stored)).not.toHaveProperty('analytic_account') })
})
