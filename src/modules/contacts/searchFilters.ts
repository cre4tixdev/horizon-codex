import type { SearchFilter } from '../../shared/search/filters'
import { Building2, Globe, List } from 'lucide-react'

export const contactStateFilter: SearchFilter = {
  key: 'state', label: 'État des fiches', defaultValue: 'active', appearance: 'compact',
  options: [{ value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }],
}

export const contactRoleFilter: SearchFilter = {
  key: 'role', label: 'Relation commerciale', defaultValue: 'all',
  options: [{ value: 'all', label: 'Toutes' }, { value: 'customer', label: 'Clients' }, { value: 'supplier', label: 'Fournisseurs' }],
}

export const contactSearchFilters: readonly SearchFilter[] = [contactRoleFilter, contactStateFilter]

export function contactGroupingFilter(people: boolean): SearchFilter {
  return { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [
    { value: 'none', label: 'Aucun regroupement', icon: List },
    { value: 'country', label: 'Pays', icon: Globe },
    ...(people ? [{ value: 'company', label: 'Société', icon: Building2 }] : []),
  ] }
}

export function contactSortFilter(people: boolean): SearchFilter {
  const name = people ? 'last_name' : 'name'
  return { key: 'sort', label: 'Trier les contacts', defaultValue: `${name}:asc`, options: [
    { value: `${name}:asc`, label: 'Nom : A → Z' }, { value: `${name}:desc`, label: 'Nom : Z → A' },
    { value: 'email:asc', label: 'E-mail : A → Z' }, { value: 'email:desc', label: 'E-mail : Z → A' },
    ...(!people ? [{ value: 'legal_name:asc', label: 'Raison sociale : A → Z' }, { value: 'legal_name:desc', label: 'Raison sociale : Z → A' }] : []),
  ] }
}
