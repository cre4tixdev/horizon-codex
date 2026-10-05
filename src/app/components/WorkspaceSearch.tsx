import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Search, ArrowUpRight, X, ChevronDown, Check } from 'lucide-react'
import { HButton } from '../../shared/ui/HButton'
import { HDialog } from '../../shared/ui/HDialog'
import { HInput } from '../../shared/ui/HInput'
import { DropdownMenu } from 'radix-ui'
import { searchNavigation } from '../searchNavigation'

export function WorkspaceSearch() {
  const { pathname } = useLocation()
  const [params, setParams] = useSearchParams()
  const scope = pathname === '/contacts' ? 'Sociétés' : pathname === '/contacts/people' ? 'Personnes' : pathname === '/settings' ? 'Paramètres' : undefined
  const [mode, setMode] = useState({ pathname, global: false })
  const global = mode.pathname === pathname && mode.global
  const contextual = Boolean(scope) && !global
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
    <HInput ref={contextualRef} type="search" aria-label={scope === 'Paramètres' ? 'Rechercher dans les paramètres' : 'Rechercher dans les contacts'} aria-describedby="workspace-search-scope" placeholder={scope === 'Paramètres' ? 'Rechercher un paramétrage…' : pathname === '/contacts' ? 'Rechercher une société, un e-mail…' : 'Rechercher une personne, une société…'} value={params.get('q') ?? ''} onChange={(event) => changeSearch(event.target.value)} />
    {params.get('q') ? <HButton variant="ghost" size="icon" aria-label="Effacer la recherche" onClick={() => { changeSearch(''); contextualRef.current?.focus() }}><X size={14} /></HButton> : <kbd>⌘ / Ctrl K</kbd>}
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
