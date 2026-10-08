import { expect, it } from 'vitest'
import { timelinePosition, timelineTicks } from './timeline'
it('clips periods spanning beyond the viewport and positions exact boundaries', () => {
  const start = new Date('2026-10-01T00:00:00Z'), end = new Date('2026-11-01T00:00:00Z')
  expect(timelinePosition('2026-09-01T00:00:00Z', start, end)).toBe(0)
  expect(timelinePosition('2026-12-01T00:00:00Z', start, end)).toBe(100)
  expect(timelinePosition('2026-10-01T00:00:00Z', start, end)).toBe(0)
  expect(timelineTicks(start, end, 'month')).toHaveLength(31)
})
it('keeps continuous tick boundaries across daylight saving, leap years and partial quarters', () => {
  const start = new Date(2028, 0, 1), end = new Date(2028, 3, 1)
  const quarter = timelineTicks(start, end, 'quarter')
  expect(quarter.at(-1)?.end).toEqual(end)
  quarter.slice(1).forEach((tick, index) => expect(tick.start).toEqual(quarter[index]!.end))
  expect(timelineTicks(new Date(2028, 1, 1), new Date(2028, 2, 1), 'month')).toHaveLength(29)
  expect(timelineTicks(start, new Date(2029, 0, 1), 'year')).toHaveLength(12)
})
