import { describe, expect, it } from 'vitest'
import { searchNavigation } from './searchNavigation'

describe('Recherche des espaces Horizon', () => {
  it('retrouve une entrée avec accents, casse et espaces différents', () => {
    expect(searchNavigation('  DEPENSES  ').map((item) => item.href)).toEqual(['/expenses'])
  })

  it('recherche aussi le vocabulaire métier des descriptions', () => {
    expect(searchNavigation('devis').map((item) => item.href)).toEqual(['/sales'])
  })

  it('retourne un résultat vide pour un terme inconnu', () => {
    expect(searchNavigation('terme-inexistant')).toEqual([])
  })
})
