import { withColumnSortOptions, type SearchFilter } from '../../shared/search/filters'
import { leaveKinds, leaveStates } from './schemas/leave'
export const leaveFilters: SearchFilter[] = [
  { key: 'status', label: 'État', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les états' }, ...Object.entries(leaveStates).map(([value, label]) => ({ value, label }))] },
  { key: 'type', label: 'Type de congé', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les types' }, ...Object.entries(leaveKinds).map(([value, label]) => ({ value, label }))] },
  { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] },
]
export const leaveGrouping: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement' }, { value: 'employee', label: 'Employé' }, { value: 'type', label: 'Type de congé' }, { value: 'status', label: 'État' }] }
export const leaveSort = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-start_date', options: [{ value: '-start_date', label: 'Début récent' }, { value: 'start_date', label: 'Début ancien' }] }, { employee: 'Employé', type: 'Type', start_date: 'Début', end_date: 'Fin', duration: 'Durée', manager: 'Manager', status: 'État' })

export const allocationGrouping: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement' }, { value: 'employee', label: 'Employé' }, { value: 'type', label: 'Type de congé' }] }
export const allocationSort = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récentes' }, { value: 'created', label: 'Plus anciennes' }] }, { created: 'Date', employee: 'Employé', type: 'Type', year: 'Année', days: 'Jours', reason: 'Motif', author: 'Attribué par' })
