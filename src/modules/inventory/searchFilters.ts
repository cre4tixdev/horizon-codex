import type { SearchFilter } from '../../shared/search/filters'
import type { Category } from './schemas/catalog'
export const catalogFilters = (categories: Category[]): SearchFilter[] => [
  { key: 'state', label: 'État', defaultValue: 'active', options: [{ value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }] },
  { key: 'category', label: 'Famille', defaultValue: '', options: [{ value: '', label: 'Toutes les familles' }, ...categories.map((item) => ({ value: item.id, label: item.label }))] },
]
export const catalogSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: 'name', options: [{ value: 'name', label: 'Nom' }, { value: 'sku', label: 'Référence' }, { value: '-created', label: 'Plus récents' }] }
export const catalogGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: '', options: [{ value: '', label: 'Aucun regroupement' }, { value: 'category', label: 'Famille' }] }
