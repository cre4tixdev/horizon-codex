import { Check, SlidersHorizontal, X, ListFilter } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useId, useRef, type ReactNode, type CSSProperties } from 'react'
import { selectedFilterValues, toggleFilterValue, type SearchFilter } from './filters'
import { HCombobox } from '../ui/HCombobox'

export type SearchFilterSelection = { filter: SearchFilter; value: string }
type Props = {
  inline?: boolean
  selections: readonly SearchFilterSelection[]
  onChange: (filter: SearchFilter, value: string) => void
  onReset: () => void
  grouping?: SearchFilterSelection | undefined
  sorting?: SearchFilterSelection | undefined
  children?: ReactNode
}

export function SearchFilterChips({ selections, onChange }: Pick<Props, 'selections' | 'onChange'>) {
  const active = selections.flatMap(({ filter, value }) => selectedFilterValues(filter, value).map((selected) => ({ filter, value: selected, selection: value })))
  if (!active.length) return null
  return <div className="search-filter-chips" role="group" aria-label="Filtres appliqués">{active.map(({ filter, value, selection }) => {
    const option = filter.options.find((option) => option.value === value)
    const label = option?.label
    return <button key={`${filter.key}-${value}`} type="button" className="search-filter-chip h-tone" data-tone={option?.tone} style={option?.color ? { '--tag-color': option.color } as CSSProperties : undefined} data-compact={filter.appearance === 'compact'} aria-label={`Retirer le filtre ${filter.label} : ${label}`} onClick={() => onChange(filter, filter.multiple ? toggleFilterValue(filter, selection, value) : filter.defaultValue)} title={`${filter.label} : ${label}`}><span>{label}</span><X size={12} aria-hidden="true" /></button>
  })}</div>
}

export function SearchFilters({ inline = false, selections, grouping, sorting, children, onChange, onReset }: Props) {
  const trigger = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const groupId = useId()
  const count = [...selections, ...(grouping ? [grouping] : []), ...(sorting ? [sorting] : [])].reduce((total, { filter, value }) => total + selectedFilterValues(filter, value).length, 0)
  if (!selections.length && !grouping && !sorting) return null
  const close = (button: ReactNode) => inline ? button : <Popover.Close asChild>{button}</Popover.Close>
  const content = <>
      <header><h2 id={titleId}>Filtres de recherche</h2>{!inline && close(<button type="button" className="search-filters-close" aria-label="Fermer les filtres"><X size={16} /></button>)}</header>
      <div className="search-options-columns" data-presentation={Boolean(grouping || sorting)}><section aria-label="Filtres"><h3><ListFilter size={14} />Filtres</h3>{selections.map(({ filter, value }) => <fieldset key={filter.key} className={filter.appearance === 'compact' ? 'search-filter--compact' : undefined}><legend>{filter.label}</legend><div className={`search-filter-options${filter.options.length > 2 ? ' search-filter-options--stacked' : ''}`}>{filter.options.map((option) => <label key={option.value} className="search-filter-option" data-selected={value === option.value || filter.multiple && selectedFilterValues(filter, value).includes(option.value)}><input type={filter.multiple ? 'checkbox' : 'radio'} name={`${groupId}-${filter.key}`} value={option.value} checked={value === option.value || Boolean(filter.multiple && selectedFilterValues(filter, value).includes(option.value))} onChange={() => onChange(filter, toggleFilterValue(filter, value, option.value))} /><span>{option.label}</span><Check size={14} aria-hidden="true" /></label>)}</div></fieldset>)}</section>
      {(grouping || sorting) && <section aria-label="Regroupement et tri">{grouping && <fieldset><legend className="search-group-title">Regrouper par</legend><div className="search-filter-options search-filter-options--stacked">{grouping.filter.options.map((option) => { const Icon = option.icon; return <label key={option.value} className="search-filter-option search-group-option" data-selected={grouping.value === option.value}><input type="radio" name={`${groupId}-group`} checked={grouping.value === option.value} onChange={() => onChange(grouping.filter, option.value)} />{Icon && <Icon size={15} aria-hidden="true" />}<span>{option.label}</span><Check size={14} aria-hidden="true" /></label> })}</div></fieldset>}{sorting && <label className="search-sort-label">Trier par<HCombobox label={sorting.filter.label} value={sorting.value} required showCodes={false} options={[...sorting.filter.options]} onChange={(value) => onChange(sorting.filter, value)} /></label>}</section>}</div>
      {children}
      <footer><button type="button" onClick={onReset} disabled={!count}>Réinitialiser</button>{close(<button type="button">Terminé</button>)}</footer>
  </>
  const className = `search-filters-panel${grouping || sorting ? ' search-filters-panel--wide' : ''}`
  if (inline) return <div className={className} aria-labelledby={titleId}>{content}</div>
  return <Popover.Root>
    <div className="search-filters-control" role="group" aria-label="Actions des filtres"><Popover.Trigger asChild><button ref={trigger} type="button" className="search-filters-trigger" aria-label={count ? `Filtres de recherche, ${count} actif${count > 1 ? 's' : ''}` : 'Filtres de recherche'} title="Filtres de recherche" data-active={count > 0}><SlidersHorizontal size={15} aria-hidden="true" /><span className="search-filters-label">Filtres</span>{count > 0 && <span className="search-filters-count">{count}</span>}</button></Popover.Trigger>{count > 0 && <button type="button" className="search-filters-reset" aria-label="Réinitialiser tous les filtres" title="Réinitialiser tous les filtres" onClick={() => { onReset(); trigger.current?.focus() }}><X size={13} aria-hidden="true" /></button>}</div>
    <Popover.Portal><Popover.Content className={className} align="end" sideOffset={10} collisionPadding={12} aria-labelledby={titleId}>
{content}</Popover.Content></Popover.Portal>
  </Popover.Root>
}
