import type { SearchFilter } from '../../shared/search/filters'
export const activityModules: Record<string, string> = { documents: 'Documents', contacts: 'Contacts', crm: 'CRM', sales: 'Ventes', purchasing: 'Achats', inventory: 'Stock', billing: 'Facturation', expenses: 'Notes de frais', leave: 'Congés' }
export const activityCategories: Record<string, string> = { changes: 'Modifications', comments: 'Commentaires', emails: 'E-mails', documents: 'Documents', tasks: 'Tâches', system: 'Événements' }
export const activityFilters = (permissions: readonly string[]): readonly SearchFilter[] => [
  { key: 'module', label: 'Modules', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les modules' }, ...Object.entries(activityModules).filter(([key]) => permissions.includes(`${key}.read`)).map(([value, label]) => ({ value, label }))] },
  { key: 'type', label: 'Type d’activité', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les types' }, ...Object.entries(activityCategories).map(([value, label]) => ({ value, label }))] },
  { key: 'period', label: 'Période', defaultValue: '30', options: [{ value: '7', label: '7 derniers jours' }, { value: '30', label: '30 derniers jours' }, { value: '90', label: '90 derniers jours' }, { value: '365', label: 'Dernière année' }, { value: 'all', label: 'Tout l’historique' }] },
]
export const activityGrouping: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: '', options: [{ value: '', label: 'Aucun regroupement' }, { value: 'module', label: 'Module' }, { value: 'type', label: 'Type d’activité' }, { value: 'day', label: 'Jour' }] }
export const activitySort: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récent' }, { value: 'created', label: 'Plus ancien' }] }
