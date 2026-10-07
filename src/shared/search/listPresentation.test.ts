import { describe, expect, it } from 'vitest'
import { groupResults, sortResults } from './listPresentation'

const items = [{ id: 'a', name: 'Équipe 10', group: 'x' }, { id: 'b', name: 'equipe 2', group: 'y' }, { id: 'c', name: 'Alpha', group: 'x' }]
describe('présentation des listes partagée', () => {
  it('trie naturellement sans muter les données et inverse le sens', () => {
    expect(sortResults(items, 'name:asc', (item) => item.name).map((item) => item.id)).toEqual(['c', 'b', 'a'])
    expect(sortResults(items, 'name:desc', (item) => item.name).map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
  it('conserve les identités distinctes, les totaux et le tri dans chaque groupe', () => {
    const sorted = sortResults(items, 'name:asc', (item) => item.name)
    const groups = groupResults(sorted, (item) => ({ key: item.group, label: 'Même libellé' }))
    expect(groups.map((group) => group.total)).toEqual([2, 1])
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['c', 'a'])
    expect(groupResults([], () => ({ key: '', label: 'Sans équipe' }))).toEqual([])
  })
})
