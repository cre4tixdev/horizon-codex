import { expect, it } from 'vitest'
import { deadlineState } from './deadline'

it('distinguishes unset, past, the final 48 hours, the final 7 days and later dates', () => {
  const now = Date.parse('2026-10-08T12:00:00.000Z')
  expect(deadlineState('', now)).toBe('unset')
  expect(deadlineState('2026-10-08T11:59:00.000Z', now)).toBe('past')
  expect(deadlineState('2026-10-08T12:00:00.000Z', now)).toBe('urgent')
  expect(deadlineState('2026-10-10T12:00:00.000Z', now)).toBe('urgent')
  expect(deadlineState('2026-10-10T12:01:00.000Z', now)).toBe('soon')
  expect(deadlineState('2026-10-15T12:00:00.000Z', now)).toBe('soon')
  expect(deadlineState('2026-10-15T12:01:00.000Z', now)).toBe('scheduled')
})
