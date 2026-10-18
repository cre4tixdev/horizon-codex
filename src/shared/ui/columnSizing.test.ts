import { describe, expect, it } from 'vitest'
import { fitColumnWidths, resizeColumnWidths } from './columnSizing'
const columns = [
  { id: 'name', minimum: 140, fallback: 300 },
  { id: 'email', minimum: 64, fallback: 200 },
  { id: 'amount', minimum: 120, fallback: 180, monetary: true },
  { id: 'state', minimum: 64, fallback: 100 },
]
const base = { name: 300, email: 200, amount: 180, state: 100 }
describe('shared column sizing', () => {
  it('fits a different viewport and protects numeric content before spare text space', () => {
    const fitted = fitColumnWidths(base, 650, columns)
    expect(Object.values(fitted).reduce((sum, width) => sum + width, 0)).toBeCloseTo(650)
    expect(fitted.amount).toBe(180)
    expect(fitColumnWidths(base, 100, columns)).toEqual({ name: 140, email: 64, amount: 120, state: 64 })
  })
  it('redistributes to the right and never moves the table edge', () => {
    const next = resizeColumnWidths(base, 'name', 10000, columns)
    expect(next).toEqual({ name: 532, email: 64, amount: 120, state: 64 })
    expect(Object.values(next).reduce((sum, width) => sum + width, 0)).toBe(780)
    expect(resizeColumnWidths(base, 'state', 100, columns)).toEqual(base)
  })
  it('compresses the selected column and then its left neighbours', () => {
    expect(resizeColumnWidths(base, 'email', -250, columns)).toEqual({ name: 186, email: 64, amount: 430, state: 100 })
  })
})
