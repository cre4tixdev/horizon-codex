import type { SearchFilter } from './filters'
/** Carry a dashboard period as one removable criterion, never two half-ranges. */
export function linkedDateRange(params: URLSearchParams) {
  const raw = params.get('date_range') || ''
  const [from, to] = raw.split(':')
  if (!from || !to || !/^20\d{2}-\d{2}-\d{2}$/.test(from) || !/^20\d{2}-\d{2}-\d{2}$/.test(to) || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || new Date(from).toISOString().slice(0, 10) !== from || new Date(to).toISOString().slice(0, 10) !== to || to < from) return {}
  return { from, to }
}
export function linkedListFilters(params: URLSearchParams, ownId: string, includeOwner: boolean): SearchFilter[] {
  const { from, to } = linkedDateRange(params)
  return [...(from && to ? [{ key: 'date_range', label: 'Période', defaultValue: '', options: [{ value: '', label: 'Toutes périodes' }, { value: `${from}:${to}`, label: `Du ${from.split('-').reverse().join('/')} au ${to.split('-').reverse().join('/')}` }] }] : []), ...(includeOwner && params.get('owner') ? [{ key: 'owner', label: 'Responsable', defaultValue: '', options: [{ value: '', label: 'Tous les responsables' }, { value: params.get('owner')!, label: params.get('owner') === ownId ? 'Mes dossiers' : 'Responsable sélectionné' }] }] : [])]
}
