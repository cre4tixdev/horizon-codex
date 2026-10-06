import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Search, ArrowUpRight, X, ChevronDown, Check } from 'lucide-react'
import { HButton } from '../../shared/ui/HButton'
import { HDialog } from '../../shared/ui/HDialog'
import { HInput } from '../../shared/ui/HInput'
import { DropdownMenu } from 'radix-ui'
import { searchNavigation } from '../searchNavigation'
import { contactSearchFilters, contactGroupingFilter, contactSortFilter } from '../../modules/contacts'
import { changeFilter, filterValue, resetFilters, type SearchFilter } from '../../shared/search/filters'
import { SearchFilterChips, SearchFilters } from '../../shared/search/SearchFilters'
import { SavedViews } from '../../shared/search/SavedViews'
import { viewParamsSchema } from '../../core/views/types'

export function WorkspaceSearch() {
  const { pathname } = useLocation()
  const [params, setParams] = useSearchParams()
  const scope = pathname === '/contacts' ? 'Sociétés' : pathname === '/contacts/people' ? 'Personnes' : pathname === '/settings' ? 'Paramètres' : undefined
  const [mode, setMode] = useState({ pathname, global: false })
  const global = mode.pathname === pathname && mode.global
  const contextual = Boolean(scope) && !global
  const filters = pathname === '/contacts' || pathname === '/contacts/people' ? contactSearchFilters : []
  const selections = filters.map((filter) => ({ filter, value: filterValue(params, filter) }))
  const directory = pathname === '/contacts' || pathname === '/contacts/people'
  const groupFilter = contactGroupingFilter(pathname === '/contacts/people')
  const sortFilter = contactSortFilter(pathname === '/contacts/people')
  const definitions = [...filters, groupFilter, sortFilter]
  const savedParams: Record<string, string> = {}
  if (params.get('q')) savedParams.q = params.get('q')!.slice(0, 200)
  if (params.get('view') === 'list') savedParams.view = 'list'
  definitions.forEach((filter) => { const value = filterValue(params, filter); if (value !== filter.defaultValue) savedParams[filter.key] = value })
  function setFilter(filter: SearchFilter, value: string) {
    setParams((current) => changeFilter(current, filter, value))
  }
  const contextualRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = searchNavigation(query)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (contextual) contextualRef.current?.focus()
        else setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [contextual])

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setQuery('')
  }

  function changeSearch(value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set('q', value)
      else next.delete('q')
      return next
    }, { replace: true })
  }

  const scopeSelector = scope ? <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild><button type="button" id="workspace-search-scope" className="workspace-search-scope" aria-label="Choisir le contexte de recherche">{contextual ? scope : 'Global'}<ChevronDown size={12} aria-hidden="true" /></button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content className="user-menu-content search-scope-menu" align="start" sideOffset={8} collisionPadding={12}>
      <DropdownMenu.Label className="user-menu-label"><strong>Rechercher dans</strong></DropdownMenu.Label>
      <DropdownMenu.RadioGroup value={contextual ? 'local' : 'global'} onValueChange={(value) => setMode({ pathname, global: value === 'global' })}>
        <DropdownMenu.RadioItem value="local"><span>{scope}<small>Contexte de cette page</small></span><DropdownMenu.ItemIndicator><Check size={14} /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="global"><span>Recherche globale<small>Accéder aux espaces Horizon</small></span><DropdownMenu.ItemIndicator><Check size={14} /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root> : <span className="workspace-search-scope">Espaces Horizon</span>

  if (contextual) return <div className="workspace-search workspace-search--contextual">
    <Search size={16} aria-hidden="true" />
    {scopeSelector}
    <SearchFilterChips selections={[...selections, ...(directory ? [{ filter: groupFilter, value: filterValue(params, groupFilter) }] : [])]} onChange={setFilter} />
    <HInput ref={contextualRef} type="search" aria-label={scope === 'Paramètres' ? 'Rechercher dans les paramètres' : 'Rechercher dans les contacts'} aria-describedby="workspace-search-scope" placeholder={scope === 'Paramètres' ? 'Rechercher un paramétrage…' : pathname === '/contacts' ? 'Rechercher une société, un e-mail…' : 'Rechercher une personne, une société…'} value={params.get('q') ?? ''} onChange={(event) => changeSearch(event.target.value)} />
    {params.get('q') ? <HButton variant="ghost" size="icon" aria-label="Effacer la recherche" onClick={() => { changeSearch(''); contextualRef.current?.focus() }}><X size={14} /></HButton> : <kbd>⌘ / Ctrl K</kbd>}
    <SearchFilters selections={selections} grouping={directory ? { filter: groupFilter, value: filterValue(params, groupFilter) } : undefined} sorting={directory ? { filter: sortFilter, value: filterValue(params, sortFilter) } : undefined} onChange={setFilter} onReset={() => setParams((current) => resetFilters(current, definitions))}>
      {directory && <SavedViews key={pathname} context={pathname === '/contacts/people' ? 'contacts.people' : 'contacts.companies'} params={viewParamsSchema.parse(savedParams)} onApply={(view) => setParams((current) => {
        const next = resetFilters(current, definitions)
        next.delete('q'); next.delete('view')
        Object.entries(view.params).forEach(([key, value]) => { if (value !== undefined) next.set(key, value) })
        return next
      })} />}
    </SearchFilters>
  </div>

  return (
    <div className="workspace-search workspace-search--contextual"><Search size={16} aria-hidden="true" />{scopeSelector}<HDialog open={open} onOpenChange={changeOpen} title="Rechercher un espace" description="Accédez rapidement aux espaces Horizon."
      onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus() }}
      trigger={<HButton variant="ghost" className="workspace-search-action" aria-label="Rechercher un espace…"><span className="workspace-search-prompt">Rechercher…</span><kbd>⌘ / Ctrl K</kbd></HButton>}>
      <div className="search-field"><Search size={17} aria-hidden="true" /><HInput ref={inputRef} aria-label="Rechercher un espace" placeholder="Contacts, devis, planning…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="search-results" aria-live="polite">
        {results.length === 0 ? <p className="search-empty">Aucun espace trouvé. Essayez un autre terme.</p> : results.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} to={href} onClick={() => changeOpen(false)} className="search-result">
            <Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="search-footer"><span>Tab pour naviguer</span><span>Échap pour fermer</span></div>
    </HDialog></div>
  )
}
