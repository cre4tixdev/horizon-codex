import { describe, expect, it } from 'vitest'
import { searchNavigation } from './searchNavigation'

describe('Recherche des espaces Horizon', () => {
  it('retrouve une entrée avec accents, casse et espaces différents', () => {
    expect(searchNavigation('  NOTES DE FRAIS  ').map((item) => item.href)).toEqual(['/expenses'])
    expect(searchNavigation('  COMPTABILITE  ').map((item) => item.href)).toEqual(['/accounting'])
  })

  it('recherche aussi le vocabulaire métier des descriptions', () => {
    expect(searchNavigation('devis').map((item) => item.href)).toEqual(['/sales'])
  })

  it('retourne un résultat vide pour un terme inconnu', () => {
    expect(searchNavigation('terme-inexistant')).toEqual([])
  })
})
