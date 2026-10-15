import { withColumnSortOptions } from '../../shared/search/filters'
import { Building2, List, Hash, Flag } from 'lucide-react'
import { resetFilters, type SearchFilter } from '../../shared/search/filters'
export function normalizeSalesFilters(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params), legacy = next.get('status') || ''
  if (legacy === 'accepted' || legacy === 'quotes') { if (!next.has('kind')) next.set('kind', legacy === 'accepted' ? 'order' : 'quote'); next.delete('status') }
  else if (!next.has('kind') && ['draft', 'validated', 'sent', 'cancelled', 'rejected'].includes(legacy)) next.set('kind', 'quote')
  if (legacy === 'archived') { next.set('state', 'archived'); next.delete('status') }
  if (legacy === 'active') next.set('status', 'draft,validated,sent')
  return next
}
export const quoteKindFilter: SearchFilter = { key: 'kind', label: 'Type de pièce', multiple: true, defaultValue: '', options: [{ value: '', label: 'Devis et commandes' }, { value: 'quote', label: 'Devis' }, { value: 'order', label: 'Commandes clients' }] }
export const quoteStateFilter: SearchFilter = { key: 'status', label: 'État des devis', multiple: true, defaultValue: '', options: [{ value: '', label: 'Tous les états des devis' }, { value: 'draft', label: 'Brouillons' }, { value: 'validated', label: 'Finalisés' }, { value: 'sent', label: 'Envoyés' }, { value: 'rejected', label: 'Refusés' }, { value: 'cancelled', label: 'Annulés' }] }
export const orderStateFilter: SearchFilter = { key: 'order_status', label: 'État des commandes', multiple: true, defaultValue: '', options: [{ value: '', label: 'Tous les états des commandes' }, { value: 'confirmed', label: 'Confirmées' }, { value: 'in_progress', label: 'En cours' }, { value: 'completed', label: 'Terminées' }] }
export const orderNumberFilter: SearchFilter = { key: 'customer_number', label: 'N° commande client', multiple: true, defaultValue: '', options: [{ value: '', label: 'Tous les numéros' }, { value: 'provided', label: 'Numéro renseigné' }, { value: 'waiting', label: 'Attente Commande' }] }
export const quoteArchiveFilter: SearchFilter = { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] }
export function quoteFilters(params: URLSearchParams): SearchFilter[] {
  const kind = normalizeSalesFilters(params).get('kind') || ''
  return [quoteKindFilter, ...(kind !== 'order' ? [quoteStateFilter] : []), ...(kind !== 'quote' ? [orderStateFilter, orderNumberFilter] : []), quoteArchiveFilter]
}
export function changeSalesFilter(params: URLSearchParams, filter: SearchFilter, value: string): URLSearchParams {
  const next = normalizeSalesFilters(params)
  if (filter.key === 'kind') { if (value === 'quote') { next.delete('order_status'); next.delete('customer_number'); if (next.get('group') === 'customer_number') next.delete('group') } if (value === 'order') next.delete('status') }
  return next
}
export const quoteSortFilter: SearchFilter = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récents' }, { value: 'quote_number', label: 'Numéro' }, { value: 'quote_date', label: 'Date du devis' }, { value: '-subtotal', label: 'Montant décroissant' }] }, {"title": "Titre", "quote_number": "Numéro", "quote_date": "Date", "subtotal": "Montant HT", "kind": "Type", "opportunity": "Opportunité", "company_name": "Société", "status": "État", "customer_order_number": "N° commande client"})
export const quoteGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement', icon: List }, { value: 'company', label: 'Société', icon: Building2 }, { value: 'status', label: 'État', icon: Flag }, { value: 'customer_number', label: 'N° commande client', icon: Hash }] }

export function resetSalesFilters(params: URLSearchParams): URLSearchParams { const next = resetFilters(normalizeSalesFilters(params), [quoteKindFilter, quoteStateFilter, orderStateFilter, orderNumberFilter, quoteArchiveFilter, quoteSortFilter, quoteGroupingFilter]); next.delete('page'); return next }
