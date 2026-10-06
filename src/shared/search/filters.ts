export type SearchFilter = {
  key: string
  label: string
  defaultValue: string
  appearance?: 'compact'
  options: readonly { value: string; label: string; icon?: LucideIcon; tone?: 'violet' | 'amber' }[]
}

export function filterValue(params: URLSearchParams, filter: SearchFilter): string {
  const value = params.get(filter.key)
  return filter.options.find((option) => option.value === value)?.value ?? filter.defaultValue
}

export function changeFilter(params: URLSearchParams, filter: SearchFilter, value: string): URLSearchParams {
  const next = new URLSearchParams(params)
  if (value === filter.defaultValue || !filter.options.some((option) => option.value === value)) next.delete(filter.key)
  else next.set(filter.key, value)
  return next
}

export function resetFilters(params: URLSearchParams, filters: readonly SearchFilter[]): URLSearchParams {
  const next = new URLSearchParams(params)
  filters.forEach((filter) => next.delete(filter.key))
  return next
}
import type { LucideIcon } from 'lucide-react'
