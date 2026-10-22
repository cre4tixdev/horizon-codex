import { describe, expect, it } from 'vitest'
import { Fuel, Hotel, Receipt, Route, Utensils } from 'lucide-react'
import { expenseCategoryIcon } from './expensePresentation'
describe('Pictogrammes des dépenses', () => {
  it('distingue les catégories et conserve un repli pour les natures personnalisées', () => {
    expect(expenseCategoryIcon({ code: 'HOTEL', mode: 'travel' })).toBe(Hotel)
    expect(expenseCategoryIcon({ code: 'CUSTOM', mode: 'travel' })).toBe(Route)
    expect(expenseCategoryIcon({ code: 'CUSTOM', mode: 'meal' })).toBe(Utensils)
    expect(expenseCategoryIcon({ code: 'CUSTOM', mode: 'fuel' })).toBe(Fuel)
    expect(expenseCategoryIcon()).toBe(Receipt)
  })
})
