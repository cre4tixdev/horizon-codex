import { describe, expect, it } from 'vitest'
import { linkedDateRange, linkedListFilters } from './linkedListFilters'
import { resetFilters } from './filters'
it('keeps a dashboard range as one visible removable criterion and preserves search', () => {
  const params = new URLSearchParams({ date_range: '2026-10-01:2026-12-31', owner: 'me', q: 'studio' })
  expect(linkedDateRange(params)).toEqual({ from: '2026-10-01', to: '2026-12-31' })
  const filters = linkedListFilters(params, 'me', true)
  expect(filters[1]!.options[1]!.label).toBe('Mes dossiers')
  const cleared = resetFilters(params, filters)
  expect(cleared.get('q')).toBe('studio'); expect(cleared.has('date_range')).toBe(false); expect(cleared.has('owner')).toBe(false)
})
describe('invalid linked periods', () => {
  for (const value of ['2026-02-30:2026-03-31', '2026-12-01:2026-10-01', '2026-10-01:', 'sql', '']) it(`ignores ${value}`, () => expect(linkedDateRange(new URLSearchParams({ date_range: value }))).toEqual({}))
})
