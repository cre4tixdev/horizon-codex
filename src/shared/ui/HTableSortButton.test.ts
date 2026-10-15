import { describe, expect, it, vi } from 'vitest'
import { listSortDirection, toggleListSort } from '../search/tableSorting'
import { withColumnSortOptions } from '../search/filters'
import type { ListTableSorting } from '../search/useListTableSorting'

describe('Shared list header sorting', () => {
  it('starts ascending, alternates directions and marks only the selected column', () => {
    const onChange = vi.fn()
    const sorting: ListTableSorting = { value: '-created', fields: { Amount: 'total', Name: 'name' }, encoding: 'prefix', onChange }
    expect(listSortDirection(sorting, 'Amount')).toBe(false)
    toggleListSort(sorting, 'Amount'); expect(onChange).toHaveBeenLastCalledWith('total')
    sorting.value = 'total'; expect(listSortDirection(sorting, 'Amount')).toBe('asc')
    toggleListSort(sorting, 'Amount'); expect(onChange).toHaveBeenLastCalledWith('-total')
    sorting.value = '-total'; expect(listSortDirection(sorting, 'Name')).toBe(false)
    toggleListSort(sorting, 'Amount'); expect(onChange).toHaveBeenLastCalledWith('total')
    toggleListSort(sorting, 'Actions'); expect(onChange).toHaveBeenCalledTimes(3)
  })
  it('preserves the existing HR colon encoding and exposes both panel choices', () => {
    const onChange = vi.fn(), sorting: ListTableSorting = { value: 'name:asc', fields: { Employee: 'name' }, encoding: 'colon', onChange }
    toggleListSort(sorting, 'Employee'); expect(onChange).toHaveBeenCalledWith('name:desc')
    const filter = withColumnSortOptions({ key: 'sort', label: 'Tri', defaultValue: 'name:asc', options: [{ value: 'name:asc', label: 'Nom' }] }, { name: 'Nom', job: 'Poste' }, 'colon')
    expect(filter.options.map((option) => option.value)).toEqual(['name:asc', 'name:desc', 'job:asc', 'job:desc'])
  })
})
