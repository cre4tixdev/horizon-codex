import { describe, expect, it } from 'vitest'
import { shiftDate, timelinePeriod, timelinePosition, timelineColor } from './timeline'
describe('Civil resource timeline', () => {
  it('keeps employee colors stable independently of row order and selection', () => {
    const first = timelineColor('employee-001'), second = timelineColor('employee-002')
    expect(timelineColor('employee-002')).toBe(second); expect(timelineColor('employee-001')).toBe(first); expect(first).not.toBe(second); expect(first).toMatch(/^#[0-9A-F]{6}$/i)
  })
  it('preserves weeks across months and years, leap days and DST', () => {
    expect(timelinePeriod('2027-01-01', 'week')).toEqual({ first: '2026-12-28', last: '2027-01-03' })
    expect(timelinePeriod('2028-02-12', 'month')).toEqual({ first: '2028-02-01', last: '2028-02-29' })
    expect(shiftDate('2026-10-25', 1)).toBe('2026-10-26')
  })
  it('clips bars and places half-days without occupying neighboring days', () => {
    expect(timelinePosition('2026-10-05', 7, '2026-10-05', '2026-10-05', 'pm', 'pm')).toEqual({ gridColumn: '2 / 3' })
    expect(timelinePosition('2026-10-05', 7, '2026-10-01', '2026-10-06', 'pm', 'am')).toEqual({ gridColumn: '1 / 4' })
    expect(timelinePosition('2026-10-05', 7, '2026-10-11', '2026-10-13', 'pm', 'am')).toEqual({ gridColumn: '14 / 15' })
    expect(timelinePosition('2026-10-05', 7, '2026-10-01', '2026-10-04', 'am', 'pm')).toBeNull()
  })
})
