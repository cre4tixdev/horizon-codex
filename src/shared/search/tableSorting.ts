import type { ListTableSorting } from './useListTableSorting'

export function listSortDirection(sorting: ListTableSorting, column: string): 'asc' | 'desc' | false {
  const field = sorting.encoding === 'colon' ? sorting.value.split(':')[0] : sorting.value.replace(/^-/, '')
  if (field !== sorting.fields[column]) return false
  return (sorting.encoding === 'colon' ? sorting.value.endsWith(':desc') : sorting.value.startsWith('-')) ? 'desc' : 'asc'
}

export function toggleListSort(sorting: ListTableSorting, column: string) {
  const field = sorting.fields[column]
  if (!field) return
  const descending = listSortDirection(sorting, column) === 'asc'
  sorting.onChange(sorting.encoding === 'colon' ? `${field}:${descending ? 'desc' : 'asc'}` : `${descending ? '-' : ''}${field}`)
}
