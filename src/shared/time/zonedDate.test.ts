import { expect, it } from 'vitest'
import { displayDate, zonedInstant, zonedInput } from './zonedDate'
it('keeps the selected timezone independently of the workstation timezone', () => {
  expect(zonedInstant('2026-07-20T14:30', 'Europe/Paris')).toBe('2026-07-20T12:30:00.000Z')
  expect(zonedInstant('2026-12-20T14:30', 'Europe/Paris')).toBe('2026-12-20T13:30:00.000Z')
  expect(zonedInput('2026-07-20T12:30:00.000Z', 'Europe/Paris')).toBe('2026-07-20T14:30')
})
it('rejects nonexistent DST times and impossible dates', () => {
  expect(() => zonedInstant('2026-03-29T02:30', 'Europe/Paris')).toThrow('n’existe pas')
  expect(() => zonedInstant('2026-02-30T12:00', 'UTC')).toThrow('invalides')
})

it('shows only the date in the dossier timezone, including across midnight', () => {
  expect(displayDate('2026-10-12T23:30:00.000Z', 'Europe/Paris')).toBe('13/10/2026')
  expect(displayDate('2026-10-12T23:30:00.000Z', 'UTC')).toBe('12/10/2026')
  expect(displayDate('')).toBe('—')
})
