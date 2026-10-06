import { z } from 'zod'
import { filterValue } from '../../shared/search/filters'
import { contactStateFilter, contactRoleFilter, contactGroupingFilter, contactSortFilter } from './searchFilters'
import type { ContactKind, ListOptions } from './types/contacts'

const contextSchema = z.object({ kind: z.enum(['companies', 'people']), query: z.string().max(2000), page: z.number().int().min(1).max(100000) })
export type ContactDirectoryContext = z.infer<typeof contextSchema>

export function directoryContext(state: unknown, kind: ContactKind): ContactDirectoryContext | undefined {
  const parsed = z.object({ contactDirectory: contextSchema }).safeParse(state)
  return parsed.success && parsed.data.contactDirectory.kind === kind ? parsed.data.contactDirectory : undefined
}

export function directoryOptions(context: ContactDirectoryContext | undefined, kind: ContactKind, active: boolean): ListOptions {
  const params = new URLSearchParams(context?.query)
  const role = filterValue(params, contactRoleFilter)
  const group = filterValue(params, contactGroupingFilter(kind === 'people'))
  const [sort, direction] = filterValue(params, contactSortFilter(kind === 'people')).split(':')
  return { search: (params.get('q') ?? '').slice(0, 200), archived: context ? filterValue(params, contactStateFilter) === 'archived' : !active, page: 1, role: role === 'customer' || role === 'supplier' ? role : undefined, group: group === 'country' || group === 'company' ? group : undefined, sort, descending: direction === 'desc' }
}

export function directoryHref(context: ContactDirectoryContext | undefined, kind: ContactKind) {
  return `${kind === 'companies' ? '/contacts' : '/contacts/people'}${context?.query ? `?${context.query}` : ''}`
}
