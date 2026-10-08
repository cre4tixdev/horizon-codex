import { expect, it } from 'vitest'
import { periodBounds, shiftPeriod } from './periods'
it('uses a Monday-start week and exclusive period end', () => {
  const bounds = periodBounds(new Date(2026, 9, 7), 'week')
  expect(bounds.start.getDay()).toBe(1)
  expect(bounds.start.getDate()).toBe(5)
  expect(bounds.end.getDate()).toBe(12)
})
it('shifts month-end and year-end anchors without skipping a period', () => {
  expect(shiftPeriod(new Date(2026, 0, 31), 'month', 1).getMonth()).toBe(1)
  const next = shiftPeriod(new Date(2026, 11, 31), 'quarter', 1)
  expect(next.getFullYear()).toBe(2027)
  expect(next.getMonth()).toBe(0)
  const bounds = periodBounds(new Date(2026, 11, 31), 'year')
  expect(bounds.end.getFullYear()).toBe(2027)
})
