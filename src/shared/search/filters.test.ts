import { describe, expect, it } from 'vitest'
import { changeFilter, filterValue, resetFilters, type SearchFilter } from './filters'

const state: SearchFilter = { key: 'state', label: 'État', defaultValue: 'active', options: [{ value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }] }
const usage: SearchFilter = { key: 'usage', label: 'Usage', defaultValue: 'all', options: [{ value: 'all', label: 'Tous' }, { value: 'customer', label: 'Client' }] }

describe('contrat des filtres de recherche', () => {
  it('utilise le défaut pour les valeurs absentes ou inconnues dans un lien partagé', () => {
    expect(filterValue(new URLSearchParams(), state)).toBe('active')
    expect(filterValue(new URLSearchParams('state=invalid'), state)).toBe('active')
    expect(filterValue(new URLSearchParams('state=archived'), state)).toBe('archived')
  })
  it('préserve recherche, vue et autres critères sans modifier les paramètres originaux', () => {
    const params = new URLSearchParams('q=Paris&view=list&usage=customer')
    const selected = changeFilter(params, state, 'archived')
    expect(params.has('state')).toBe(false)
    expect(selected.get('q')).toBe('Paris')
    expect(selected.get('view')).toBe('list')
    expect(selected.get('usage')).toBe('customer')
    expect(selected.get('state')).toBe('archived')
    expect(changeFilter(selected, state, 'active').has('state')).toBe(false)
  })
  it('réinitialise les critères déclarés seulement, y compris les valeurs inconnues', () => {
    const params = new URLSearchParams('q=Paris&view=cards&state=invalid&usage=customer&section=contacts')
    expect(resetFilters(params, [state, usage]).toString()).toBe('q=Paris&view=cards&section=contacts')
    expect(changeFilter(params, state, 'arbitrary').has('state')).toBe(false)
  })
})
