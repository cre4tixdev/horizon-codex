import type { SearchFilter } from '../../shared/search/filters'
export const qualityMode: SearchFilter = { key: 'mode', label: 'Parcours', defaultValue: 'manual', options: [{ value: 'manual', label: 'Sélection manuelle' }, { value: 'duplicates', label: 'Doublons potentiels' }] }
export const qualitySort: SearchFilter = { key: 'sort', label: 'Trier les fiches', defaultValue: 'name:asc', options: [{ value: 'name:asc', label: 'Nom : A → Z' }, { value: 'name:desc', label: 'Nom : Z → A' }] }
