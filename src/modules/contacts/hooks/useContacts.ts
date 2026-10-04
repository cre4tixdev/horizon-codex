import { useQuery } from '@tanstack/react-query'
import { contactsService } from '../services/ContactsService'
import type { ContactKind, ListOptions } from '../types/contacts'

export const contactsKey = ['contacts'] as const
export function useContactList(kind: ContactKind, options: ListOptions, enabled: boolean) {
  return useQuery({ queryKey: [...contactsKey, kind, options], queryFn: async () => kind === 'companies' ? contactsService.companies(options) : contactsService.people(options), enabled, retry: false })
}
