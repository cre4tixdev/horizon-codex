import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
const math = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/analytic-math.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { allocationCents: (total: number, quantities: number[], quantity: number) => number[] }
describe('Analytic allocation rounding', () => {
  it('preserves every cent across split commands', () => {
    expect(math.allocationCents(1, [1, 1, 1], 3)).toEqual([33, 34, 33])
    expect(math.allocationCents(1234.56, [2, 3, 5], 10).reduce((sum, value) => sum + value, 0)).toBe(123456)
  })
  it('does not allocate an unassigned quantity', () => {
    expect(math.allocationCents(10, [2], 10)).toEqual([200])
  })
  it('rejects invalid denominators and amounts', () => {
    expect(() => math.allocationCents(10, [1], 0)).toThrow()
    expect(() => math.allocationCents(Infinity, [1], 1)).toThrow()
  })
})
