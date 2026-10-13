import { describe, expect, it } from 'vitest'
import { changeFilter, filterValue } from '../../shared/search/filters'
import { purchasingFilters } from './searchFilters'

describe('filtres de l’accueil Achats', () => {
  it('ouvre les pièces en attente et permet de sélectionner toutes les pièces non archivées', () => {
    const status = purchasingFilters('all')[0]!
    const params = new URLSearchParams('q=câble&group=supplier_name')
    expect(filterValue(params, status)).toBe('pending')
    const all = changeFilter(params, status, '')
    expect(all.has('status')).toBe(true)
    expect(all.get('status')).toBe('')
    expect(all.get('q')).toBe('câble')
    expect(all.get('group')).toBe('supplier_name')
    expect(params.has('status')).toBe(false)
  })

  it('réserve les critères de type à la liste commune et conserve les états des listes dédiées', () => {
    const values = (kind: 'all' | 'requests' | 'orders') => purchasingFilters(kind)[0]!.options.map((option) => option.value)
    expect(values('all')).toEqual(expect.arrayContaining(['requests', 'orders', 'pending', 'received', 'ordered']))
    expect(values('requests')).not.toContain('orders')
    expect(values('orders')).not.toContain('pending')
  })
})
