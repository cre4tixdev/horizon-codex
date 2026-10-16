import { describe, it, expect } from 'vitest'
import { fitQuoteColumns, resizeQuoteColumn, quoteVisibleIndices, quoteSectionEnd, visibleQuoteColumns } from './quoteColumns'
import { quoteColumns } from '../schemas/quotes'
const base = Object.fromEntries(quoteColumns.map(([key, , width]) => [key, width]))
describe('quote presentation', () => {
  it('fits the layout and clamps resizing to the available right-hand space', () => {
    const fitted = fitQuoteColumns(base, 1200)
    expect(Object.values(fitted).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1200)
    const resized = resizeQuoteColumn(fitted, 'description', 10)
    expect(resized.description).toBeGreaterThan(fitted.description!)
    expect(Object.values(resized).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1200)
    expect(Object.values(resizeQuoteColumn(fitted, 'description', 100000)).reduce((sum, width) => sum + width, 0)).toBeCloseTo(1200)
  })
  it('keeps left columns fixed and stops at right-hand minimums', () => {
    const columns = quoteColumns.filter(([key]) => ['description', 'brand', 'reference'].includes(key))
    const current = { description: 200, brand: 100, reference: 65 }
    const resized = resizeQuoteColumn(current, 'brand', 80, columns)
    expect(resized).toEqual({ description: 200, brand: 110, reference: 55 })
    expect(fitQuoteColumns(resized, 365, columns)).toEqual(resized)
    expect(resizeQuoteColumn(resized, 'reference', 30, columns)).toEqual({ description: 200, brand: 110, reference: 55 })
    expect(resizeQuoteColumn(current, 'brand', -500, columns)).toEqual({ description: 120, brand: 45, reference: 200 })
  })
  it('compresses the selected column then its left neighbours and grows only the right neighbour', () => {
    const columns = quoteColumns.filter(([key]) => ['description', 'brand', 'reference', 'quantity'].includes(key))
    const current = { description: 200, brand: 100, reference: 65, quantity: 50 }
    expect(resizeQuoteColumn(current, 'reference', -30, columns)).toEqual({ description: 200, brand: 80, reference: 55, quantity: 80 })
    expect(resizeQuoteColumn(current, 'reference', -500, columns)).toEqual({ description: 120, brand: 45, reference: 55, quantity: 195 })
    expect(resizeQuoteColumn(current, 'description', -500, columns)).toEqual({ description: 120, brand: 180, reference: 65, quantity: 50 })
    const rounded = { description: 119.9, brand: 44.9, reference: 54.9, quantity: 50 }
    expect(resizeQuoteColumn(rounded, 'reference', -30, columns)).toEqual(rounded)
  })
  it('refits oversized saved widths on a smaller viewport and fills new spare space', () => {
    const columns = quoteColumns.filter(([key]) => ['description', 'brand'].includes(key))
    expect(Object.values(fitQuoteColumns({ description: 400, brand: 100 }, 300, columns)).reduce((sum, width) => sum + width, 0)).toBeCloseTo(300)
    expect(fitQuoteColumns({ description: 400, brand: 100 }, 700, columns)).toEqual({ description: 600, brand: 100 })
  })
  it('protects monetary content and compresses text before spare monetary width', () => {
    const columns = quoteColumns.filter(([key]) => ['description', 'unit_price', 'line_total'].includes(key))
    const current = { description: 300, unit_price: 160, line_total: 240 }
    const limits = { unit_price: 130, line_total: 190 }
    expect(fitQuoteColumns(current, 600, columns, limits)).toEqual({ description: 200, unit_price: 160, line_total: 240 })
    const resized = resizeQuoteColumn(current, 'line_total', -250, columns, limits)
    expect(resized).toEqual(current) // Outer edge stays fixed.
    const clamped = resizeQuoteColumn(current, 'description', 500, columns, limits)
    expect(clamped).toEqual({ description: 380, unit_price: 130, line_total: 190 })
    expect(fitQuoteColumns(current, 300, columns, limits)).toEqual({ description: 120, unit_price: 130, line_total: 190 })
  })
  it('hides descendants until the next same-level heading and preserves nested folds', () => {
    const kinds = ['section', 'subsection', 'subsection3', 'item', 'subsection3', 'item', 'subsection', 'item', 'section', 'item']
    const ids = kinds.map((_, index) => String(index))
    expect(quoteVisibleIndices(kinds, ids, new Set(['0']))).toEqual([0, 8, 9])
    expect(quoteVisibleIndices(kinds, ids, new Set(['1']))).toEqual([0, 1, 6, 7, 8, 9])
    expect(quoteVisibleIndices(kinds, ids, new Set(['2']))).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9])
  })
})

it('bounds a section copy at the next heading of equal or higher level', () => {
  const kinds = ['section', 'item', 'subsection', 'subsection3', 'item', 'subsection3', 'note', 'subsection', 'item', 'section', 'item']
  expect(quoteSectionEnd(kinds, 0)).toBe(9)
  expect(quoteSectionEnd(kinds, 2)).toBe(7)
  expect(quoteSectionEnd(kinds, 3)).toBe(5)
  expect(quoteSectionEnd(kinds, 7)).toBe(9)
  expect(quoteSectionEnd(kinds, 9)).toBe(11)
  expect(quoteSectionEnd(kinds, 1)).toBe(2)
})

it('shows purchasing tracking only for customer orders and returns its space to other columns', () => {
  for (const status of [undefined, 'draft', 'validated', 'sent', 'cancelled', 'rejected'] as const) {
    const columns = visibleQuoteColumns(status)
    expect(columns.some(([key]) => key === 'actions')).toBe(true)
    for (const hidden of ['purchase', 'receipt', 'delivery', 'invoiced']) expect(columns.some(([key]) => key === hidden)).toBe(false)
    const fitted = fitQuoteColumns(base, 1200, columns)
    for (const hidden of ['purchase', 'receipt', 'delivery', 'invoiced']) expect(fitted).not.toHaveProperty(hidden)
    expect(Object.values(fitted).reduce((sum, width) => sum + width, 0)).toBeCloseTo(1200)
    const resized = resizeQuoteColumn(fitted, 'line_total', 40, columns)
    expect(Object.values(resized).every(Number.isFinite)).toBe(true)
    expect(Object.values(resized).reduce((sum, width) => sum + width, 0)).toBeCloseTo(1200)
  }
  expect(visibleQuoteColumns('accepted').some(([key]) => key === 'actions')).toBe(false)
  for (const visible of ['purchase', 'receipt', 'delivery', 'invoiced']) expect(visibleQuoteColumns('accepted').some(([key]) => key === visible)).toBe(true)
})

it('offers line actions again while editing a confirmed order', () => {
  const editable = visibleQuoteColumns('accepted', true).map(([key]) => key)
  expect(editable).toContain('actions')
  expect(editable).toContain('delivery')
  expect(visibleQuoteColumns('accepted').map(([key]) => key)).not.toContain('actions')
})
