import { describe, it, expect } from 'vitest'
import { fitQuoteColumns, resizeQuoteColumn, quoteVisibleIndices, quoteSectionEnd } from './quoteColumns'
import { quoteColumns } from '../schemas/quotes'
const base = Object.fromEntries(quoteColumns.map(([key, , width]) => [key, width]))
describe('quote presentation', () => {
  it('fits every column and borrows space when resizing instead of widening the table', () => {
    const fitted = fitQuoteColumns(base, 1200)
    expect(Object.values(fitted).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1200)
    const resized = resizeQuoteColumn(fitted, 'description', 180)
    expect(resized.description).toBeGreaterThan(fitted.description!)
    expect(Object.values(resized).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1200)
    expect(resizeQuoteColumn(fitted, 'description', 100000).description).toBeLessThan(1200)
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
