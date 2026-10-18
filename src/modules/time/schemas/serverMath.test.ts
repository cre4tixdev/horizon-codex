import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
// Explicit interop type for the pure PocketBase CommonJS helper, exercised without a server.
const math = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/time-math.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { valid: (value: unknown) => boolean; monday: (day: string) => string; checkDays: (lines: unknown[]) => number[] }
describe('TimeReport server calendar and daily integrity', () => {
  it('refuse les dates impossibles avant de calculer la semaine', () => { expect(math.valid('2026-02-30')).toBe(false); expect(math.valid('2028-02-29')).toBe(true); expect(() => math.monday('2026-13-01')).toThrow('Date invalide'); expect(math.monday('2027-01-01')).toBe('2026-12-28') })
  it('consolide les lignes et refuse un total de plus de 24 h', () => { const line = (n: number) => ({ days: Array.from({ length: 7 }, () => ({ minutes: n })) }); expect(math.checkDays([line(700), line(740)])).toEqual(Array(7).fill(1440)); expect(() => math.checkDays([line(1000), line(500)])).toThrow('24 h') })
  it('refuse les fractions, jours absents et entrées malformées', () => { for (const input of [[null], [{ days: [] }], [{ days: Array(7).fill(null) }], [{ days: Array(7).fill({ minutes: 0.5 }) }]]) expect(() => math.checkDays(input)).toThrow() })
})
