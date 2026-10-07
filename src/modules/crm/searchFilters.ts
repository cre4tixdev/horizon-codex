import type { SearchFilter } from '../../shared/search/filters'
export const crmSearchFilters: SearchFilter[] = [
  { key: 'status', label: 'État', defaultValue: '', options: [{ value: '', label: 'Tous les états' }, { value: 'open', label: 'Ouvertes' }, { value: 'won', label: 'Gagnées' }, { value: 'completed', label: 'Terminées' }, { value: 'lost', label: 'Perdues' }, { value: 'cancelled', label: 'Annulées' }] },
  { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Actives' }, { value: 'archived', label: 'Archivées' }] },
]
export const crmSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récentes' }, { value: 'title', label: 'Titre' }, { value: 'expected_date', label: 'Échéance' }, { value: '-estimated_value', label: 'Montant décroissant' }] }
