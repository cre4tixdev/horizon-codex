import { describe, expect, it } from 'vitest'
import { sequenceInputSchema, sequencePreview } from './sequences'
describe('Séquences', () => {
  const input = { start_value: 1, next_value: 42, prefix: 'D-', suffix: '-CVS', padding: 5 }
  it('prévisualise sans tronquer les numéros dépassant le minimum de chiffres', () => {
    expect(sequencePreview(input)).toBe('D-00042-CVS')
    expect(sequencePreview({ ...input, next_value: 123456 })).toBe('D-123456-CVS')
  })
  it('refuse les compteurs incohérents, fractions, formats et tokens non autorisés', () => {
    for (const change of [{ next_value: 0 }, { start_value: 43 }, { next_value: 1.5 }, { padding: 13 }, { prefix: '{YYYY}' }, { suffix: '\n' }]) expect(sequenceInputSchema.safeParse({ ...input, ...change }).success).toBe(false)
  })
})
