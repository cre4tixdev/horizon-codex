import type { TagTone } from '../schemas/tagTone'
export type SearchFilter = {
  key: string
  label: string
  defaultValue: string
  appearance?: 'compact'
  multiple?: boolean
  options: readonly { value: string; label: string; icon?: LucideIcon; tone?: TagTone; color?: string | undefined }[]
}

export function filterValue(params: URLSearchParams, filter: SearchFilter): string {
  const value = params.get(filter.key)
  if (filter.multiple) return filter.options.filter((option) => option.value !== filter.defaultValue && value?.split(',').includes(option.value)).map((option) => option.value).join(',') || filter.defaultValue
  return filter.options.find((option) => option.value === value)?.value ?? filter.defaultValue
}

export function changeFilter(params: URLSearchParams, filter: SearchFilter, value: string): URLSearchParams {
  const next = new URLSearchParams(params)
  const valid = filter.multiple ? filter.options.filter((option) => option.value !== filter.defaultValue && value.split(',').includes(option.value)).map((option) => option.value).join(',') || filter.defaultValue : filter.options.some((option) => option.value === value) ? value : filter.defaultValue
  if (valid === filter.defaultValue) next.delete(filter.key)
  else next.set(filter.key, valid)
  return next
}

export function selectedFilterValues(filter: SearchFilter, value: string): string[] { return value === filter.defaultValue ? [] : filter.multiple ? value.split(',') : [value] }
export function toggleFilterValue(filter: SearchFilter, value: string, option: string): string {
  if (!filter.multiple || option === filter.defaultValue) return option
  const selected = selectedFilterValues(filter, value)
  return filter.options.filter((item) => item.value !== filter.defaultValue && (selected.includes(item.value) !== (item.value === option))).map((item) => item.value).join(',') || filter.defaultValue
}

export function resetFilters(params: URLSearchParams, filters: readonly SearchFilter[]): URLSearchParams {
  const next = new URLSearchParams(params)
  filters.forEach((filter) => next.delete(filter.key))
  return next
}
import type { LucideIcon } from 'lucide-react'
