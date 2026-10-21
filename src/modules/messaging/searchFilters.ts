import { withColumnSortOptions, type SearchFilter } from '../../shared/search/filters'
import { mailStates, contexts } from './schemas/mail'
export const mailFilters: SearchFilter[] = [
  { key: 'status', label: 'État', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les états' }, ...Object.entries(mailStates).map(([value, label]) => ({ value, label }))] },
  { key: 'context', label: 'Type de pièce', defaultValue: '', multiple: false, options: [{ value: '', label: 'Tous les types' }, ...Object.entries(contexts).map(([value, label]) => ({ value, label }))] },
  { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] },
]
export const mailGrouping: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement' }, { value: 'status', label: 'État' }, { value: 'source_context', label: 'Type de pièce' }, { value: 'from_address', label: 'Expéditeur' }] }
export const mailSort = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-created', options: [{ value: '-created', label: 'Plus récents' }, { value: 'created', label: 'Plus anciens' }] }, { subject: 'Objet', from_address: 'Expéditeur', status: 'État', created: 'Date', source_label: 'Pièce' })

export const receivedMailFilters = mailFilters.filter((filter) => filter.key === 'context')
export const receivedMailGrouping: SearchFilter = { ...mailGrouping, options: mailGrouping.options.filter((option) => option.value !== 'status') }
export const receivedMailSort = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-received_at', options: [{ value: '-received_at', label: 'Plus récents' }, { value: 'received_at', label: 'Plus anciens' }] }, { subject: 'Objet', sender_address: 'Expéditeur', received_at: 'Date', source_label: 'Pièce' })
