import { Building2, List } from 'lucide-react'
import type { Reference } from '../settings/types/references'
import type { SearchFilter } from '../../shared/search/filters'
export const crmSearchFilters: SearchFilter[] = [
  { key: 'type', label: 'Type d’opportunité', defaultValue: '', options: [{ value: '', label: 'Toutes les opportunités' }, { value: 'direct', label: 'Directes' }, { value: 'tender', label: 'Appels d’offres' }] },
  { key: 'status', label: 'État', defaultValue: '', options: [{ value: '', label: 'Tous les états' }, { value: 'open', label: 'Ouvertes' }, { value: 'won', label: 'Gagnées' }, { value: 'completed', label: 'Terminées' }, { value: 'lost', label: 'Perdues' }, { value: 'cancelled', label: 'Annulées' }] },
  { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Actives' }, { value: 'archived', label: 'Archivées' }] },
]
export const crmSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récentes' }, { value: 'title', label: 'Titre' }, { value: 'expected_date', label: 'Échéance' }, { value: '-estimated_value', label: 'Montant décroissant' }] }

export const aoSearchFilters = crmSearchFilters.filter((filter) => filter.key === 'state')
export const tenderSortFilter: SearchFilter = { key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récents' }, { value: 'title', label: 'Titre' }, { value: 'reference', label: 'Référence AO' }, { value: 'submission_deadline', label: 'Remise' }, { value: '-estimated_value', label: 'Montant décroissant' }] }

export const crmGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement', icon: List }, { value: 'company', label: 'Société', icon: Building2 }] }
export function tenderSearchFilters(stages: Reference[], tags: Reference[]): SearchFilter[] { return [...aoSearchFilters, { key: 'preparation', label: 'Préparation AO', defaultValue: '', options: [{ value: '', label: 'Toutes les étapes' }, ...stages.map((item) => ({ value: item.id, label: item.label, tone: item.tone || 'blue' as const, color: item.color }))] }, { key: 'tag', label: 'Tag AO', defaultValue: '', options: [{ value: '', label: 'Tous les tags' }, ...tags.map((item) => ({ value: item.id, label: item.label, tone: item.tone || 'blue' as const, color: item.color }))] }] }
