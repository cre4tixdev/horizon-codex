import { describe, expect, it } from 'vitest'
import { summarizeStock } from './stockBalance'
describe('Stock du produit', () => {
  it('distingue physique, réservé et disponible sur tous les emplacements', () => {
    expect(summarizeStock([{ physical: 10, reserved: 3, available: 7 }, { physical: 5, reserved: 2, available: 3 }])).toEqual({ physical: 15, reserved: 5, available: 10 })
  })
  it('conserve les fractions d’unité sans erreur flottante', () => {
    expect(summarizeStock([{ physical: .1, reserved: 0, available: .1 }, { physical: .2, reserved: .1, available: .1 }])).toEqual({ physical: .3, reserved: .1, available: .2 })
    expect(summarizeStock([])).toEqual({ physical: 0, reserved: 0, available: 0 })
  })
})
