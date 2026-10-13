import { Building2, List, Target, Flag } from 'lucide-react'
import { changeFilter, resetFilters, type SearchFilter } from '../../shared/search/filters'
import { purchaseLabels, type PurchaseKind } from './schemas/purchasing'
export const purchasingArchiveFilter: SearchFilter = { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] }
export const purchasingKindFilter: SearchFilter = { key: 'kind', label: 'Type de pièce', multiple: true, defaultValue: '', options: [{ value: '', label: 'DA et BC' }, { value: 'requests', label: 'Demandes d’achat' }, { value: 'orders', label: 'Bons de commande' }] }
const requestStates = ['draft', 'validated', 'partially_ordered', 'ordered', 'completed', 'cancelled']
const orderStates = ['draft', 'validated', 'sent', 'acknowledged', 'partially_received', 'received', 'closed', 'cancelled']
export function normalizePurchasingFilters(params: URLSearchParams, overview = false) {
  const next = new URLSearchParams(params), legacy = next.get('status')
  if (legacy === 'archived') { next.set('status', ''); if (!next.has('state')) next.set('state', 'archived') }
  if (overview && (legacy === 'requests' || legacy === 'orders')) { if (!next.has('kind')) next.set('kind', legacy); next.set('status', legacy === 'requests' ? 'pending' : '') }
  if (overview && !next.has('status')) next.set('status', 'pending')
  return next
}
export function purchasingFilters(route: PurchaseKind | 'all', params = new URLSearchParams()): SearchFilter[] {
  const kind = route === 'all' ? normalizePurchasingFilters(params, true).get('kind') || '' : route
  const states = [...new Set([...(kind !== 'orders' ? requestStates : []), ...(kind !== 'requests' ? orderStates : [])])]
  return [...(route === 'all' ? [purchasingKindFilter] : []), { key: 'status', label: 'État', multiple: true, defaultValue: '', options: [{ value: '', label: 'Tous les états' }, ...(route !== 'orders' ? [{ value: 'pending', label: 'En attente' }] : []), ...states.map((value) => ({ value, label: purchaseLabels[value]! }))] }, purchasingArchiveFilter]
}
export function changePurchasingFilter(params: URLSearchParams, filter: SearchFilter, value: string, route: PurchaseKind | 'all') {
  const next = changeFilter(normalizePurchasingFilters(params, route === 'all'), filter, value)
  if (route === 'all' && filter.key === 'status' && value === '') next.set('status', '')
  if (route === 'all' && filter.key === 'kind') {
    const status = purchasingFilters('all', next).find((item) => item.key === 'status')!
    next.set('status', (next.get('status') || '').split(',').filter((value) => status.options.some((option) => option.value === value)).join(','))
  }
  next.delete('page'); return next
}
export function resetPurchasingFilters(params: URLSearchParams, route: PurchaseKind | 'all') { const next = resetFilters(params, [...purchasingFilters('all'), purchasingSortFilter, purchasingGroupingFilter]); next.delete('page'); if (route === 'all') next.set('status', 'pending'); return next }
export const purchasingSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récentes' }, { value: 'title', label: 'Titre' }, { value: 'document_date', label: 'Date' }] }
export const purchasingGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement', icon: List }, { value: 'supplier_name', label: 'Fournisseur', icon: Building2 }, { value: 'opportunity', label: 'Opportunité', icon: Target }, { value: 'status', label: 'État', icon: Flag }] }

/** Each document appears once; multi-affair documents retain all their allocations. */
export function purchaseGroup(item: { status: string; supplier_name: string; lines: readonly { allocations: readonly { opportunity: string; code: string; label: string }[] }[] }, group: string) {
  if (group === 'status') return { key: item.status, label: purchaseLabels[item.status] || item.status }
  if (group === 'opportunity') {
    const opportunities = new Map(item.lines.flatMap((line) => line.allocations).filter((allocation) => allocation.opportunity).map((allocation) => [allocation.opportunity, allocation]))
    const entries = [...opportunities.entries()].sort(([left], [right]) => left.localeCompare(right))
    return { key: entries.map(([id]) => id).join(',') || 'none', label: entries.map(([, item]) => `${item.code} · ${item.label}`).join(' / ') || 'Sans opportunité' }
  }
  return { key: item.supplier_name || 'none', label: item.supplier_name || 'Sans fournisseur' }
}
