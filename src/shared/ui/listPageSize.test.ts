import { describe, expect, it } from 'vitest'
import { automaticPageSize, selectedPageSize } from './listPageSize'

describe('Taille de page selon l’espace disponible', () => {
  it('affiche plus de lignes sur un écran haut et tient compte de la densité', () => {
    expect(automaticPageSize({ height: 1440, top: 320, rowHeight: 32 })).toBe(34)
    expect(automaticPageSize({ height: 900, top: 320, rowHeight: 32 })).toBe(17)
    expect(automaticPageSize({ height: 900, top: 320, rowHeight: 64 })).toBe(8)
  })
  it('remplit des rangées de cartes selon la largeur sans dépasser cent résultats', () => {
    expect(automaticPageSize({ height: 1000, top: 320, rowHeight: 112, columns: 4, gap: 12, mode: 'cards' })).toBe(20)
    expect(automaticPageSize({ height: 1000, top: 320, rowHeight: 112, columns: 1, gap: 12, mode: 'cards' })).toBe(5)
    expect(automaticPageSize({ height: 10000, top: 320, rowHeight: 32 })).toBe(100)
    expect(automaticPageSize({ height: 300, top: 320, rowHeight: 32 })).toBe(5)
  })
  it('n’accepte que les tailles manuelles proposées', () => {
    expect(selectedPageSize('50')).toBe(50)
    for (const value of [null, 'auto', '1000', '-1', '20', '25.5']) expect(selectedPageSize(value)).toBeUndefined()
  })
})
