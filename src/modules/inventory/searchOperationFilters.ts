import type { SearchFilter } from '../../shared/search/filters'
import { operationKinds, operationLabels, operationStates, type Operation } from './schemas/operations'
export const operationArchiveFilter: SearchFilter = { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] }
export function normalizeOperationFilters(params: URLSearchParams) { const next = new URLSearchParams(params); if (next.get('status') === 'archived') { next.delete('status'); if (!next.has('state')) next.set('state', 'archived') }; return next }
export function stockOperationFilters(inventories: boolean, params = new URLSearchParams()): SearchFilter[] {
  const kind = params.get('kind') || ''
  return [ ...(!inventories ? [{ key: 'kind', label: 'Opération', multiple: true, defaultValue: '', options: [{ value: '', label: 'Toutes les opérations' }, ...operationKinds.filter((kind) => kind !== 'INV').map((value) => ({ value, label: operationLabels[value] }))] }] : []), ...(!inventories && (!kind || kind.split(',').includes('OUT')) ? [{ key: 'variant', label: 'Sortie', multiple: true, defaultValue: '', options: [{ value: '', label: 'Toutes les sorties' }, { value: 'delivery', label: 'Livraison client' }, { value: 'dropship', label: 'Livraison directe' }, { value: 'scrap', label: 'Mise au rebut' }] }] : []), { key: 'status', label: 'État', multiple: true, defaultValue: '', options: [{ value: '', label: 'Tous les états' }, { value: 'open', label: 'En cours' }, ...Object.entries(operationStates).map(([value, label]) => ({ value, label }))] }, operationArchiveFilter ]
}
export function changeOperationFilter(params: URLSearchParams, filter: SearchFilter, value: string) { const next = normalizeOperationFilters(params); if (filter.key === 'variant' && value && !next.get('kind')) next.set('kind', 'OUT'); if (filter.key === 'kind' && value && !value.split(',').includes('OUT')) next.delete('variant'); return next }
export const operationGroupFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: '', options: [{ value: '', label: 'Aucun regroupement' }, { value: 'warehouse_name', label: 'Entrepôt' }, { value: 'kind', label: 'Opération' }, { value: 'status', label: 'État' }, { value: 'opportunity', label: 'Opportunité' }, { value: 'supplier', label: 'Fournisseur' }] }
export function operationGroup(item: Pick<Operation, 'kind' | 'status' | 'warehouse' | 'warehouse_name' | 'opportunity' | 'opportunity_name' | 'opportunities' | 'supplier_name'>, group: string) {
  if (group === 'kind') return { key: item.kind, label: operationLabels[item.kind] }
  if (group === 'status') return { key: item.status, label: operationStates[item.status] || item.status }
  if (group === 'supplier') return { key: item.supplier_name || 'none', label: item.supplier_name || 'Sans fournisseur' }
  if (group === 'opportunity') { const items = [...new Map(item.opportunities.map((item) => [item.id, item])).values()].sort((a, b) => a.id.localeCompare(b.id)); return { key: items.map((item) => item.id).join(',') || item.opportunity || 'none', label: items.map((item) => item.name).join(' / ') || item.opportunity_name || 'Sans opportunité' } }
  return { key: item.warehouse, label: item.warehouse_name }
}
export const operationSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récentes' }, { value: 'number', label: 'Numéro' }, { value: 'planned_date', label: 'Date planifiée' }] }
