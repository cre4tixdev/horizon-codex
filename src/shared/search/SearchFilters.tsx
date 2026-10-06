import { Check, SlidersHorizontal, X, ListFilter } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import type { SearchFilter } from './filters'
import { HCombobox } from '../ui/HCombobox'

export type SearchFilterSelection = { filter: SearchFilter; value: string }
type Props = {
  selections: readonly SearchFilterSelection[]
  onChange: (filter: SearchFilter, value: string) => void
  onReset: () => void
  grouping?: SearchFilterSelection | undefined
  sorting?: SearchFilterSelection | undefined
  children?: ReactNode
}

export function SearchFilterChips({ selections, onChange }: Pick<Props, 'selections' | 'onChange'>) {
  const active = selections.filter(({ filter, value }) => value !== filter.defaultValue)
  if (!active.length) return null
  return <div className="search-filter-chips" role="group" aria-label="Filtres appliqués">{active.map(({ filter, value }) => {
    const option = filter.options.find((option) => option.value === value)
    const label = option?.label
    return <button key={filter.key} type="button" className="search-filter-chip" data-tone={option?.tone} data-compact={filter.appearance === 'compact'} aria-label={`Retirer le filtre ${filter.label} : ${label}`} onClick={() => onChange(filter, filter.defaultValue)} title={`${filter.label} : ${label}`}><span>{label}</span><X size={12} aria-hidden="true" /></button>
  })}</div>
}

export function SearchFilters({ selections, grouping, sorting, children, onChange, onReset }: Props) {
  const titleId = useId()
  const groupId = useId()
  const count = [...selections, ...(grouping ? [grouping] : [])].filter(({ filter, value }) => value !== filter.defaultValue).length
  if (!selections.length) return null
  return <Popover.Root>
    <Popover.Trigger asChild><button type="button" className="search-filters-trigger" aria-label={count ? `Filtres de recherche, ${count} actif${count > 1 ? 's' : ''}` : 'Filtres de recherche'} title="Filtres de recherche" data-active={count > 0}><SlidersHorizontal size={15} aria-hidden="true" /><span className="search-filters-label">Filtres</span>{count > 0 && <span className="search-filters-count">{count}</span>}</button></Popover.Trigger>
    <Popover.Portal><Popover.Content className={`search-filters-panel${grouping ? ' search-filters-panel--wide' : ''}`} align="end" sideOffset={10} collisionPadding={12} aria-labelledby={titleId}>
      <header><h2 id={titleId}>Filtres de recherche</h2><Popover.Close asChild><button type="button" className="search-filters-close" aria-label="Fermer les filtres"><X size={16} /></button></Popover.Close></header>
      <div className="search-options-columns"><section aria-label="Filtres"><h3><ListFilter size={14} />Filtres</h3>{selections.map(({ filter, value }) => <fieldset key={filter.key} className={filter.appearance === 'compact' ? 'search-filter--compact' : undefined}><legend>{filter.label}</legend><div className={`search-filter-options${filter.options.length > 2 ? ' search-filter-options--stacked' : ''}`}>{filter.options.map((option) => <label key={option.value} className="search-filter-option" data-selected={value === option.value}><input type="radio" name={`${groupId}-${filter.key}`} value={option.value} checked={value === option.value} onChange={() => onChange(filter, option.value)} /><span>{option.label}</span><Check size={14} aria-hidden="true" /></label>)}</div></fieldset>)}</section>
      {grouping && <section aria-label="Regroupement et tri"><fieldset><legend className="search-group-title">Regrouper par</legend><div className="search-filter-options search-filter-options--stacked">{grouping.filter.options.map((option) => { const Icon = option.icon; return <label key={option.value} className="search-filter-option search-group-option" data-selected={grouping.value === option.value}><input type="radio" name={`${groupId}-group`} checked={grouping.value === option.value} onChange={() => onChange(grouping.filter, option.value)} />{Icon && <Icon size={15} aria-hidden="true" />}<span>{option.label}</span><Check size={14} aria-hidden="true" /></label> })}</div></fieldset>{sorting && <label className="search-sort-label">Trier par<HCombobox label={sorting.filter.label} value={sorting.value} required showCodes={false} options={[...sorting.filter.options]} onChange={(value) => onChange(sorting.filter, value)} /></label>}</section>}</div>
      {children}
      <footer><button type="button" onClick={onReset} disabled={!count}>Réinitialiser</button><Popover.Close asChild><button type="button">Terminé</button></Popover.Close></footer>
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
