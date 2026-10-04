import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Search, ArrowUpRight } from 'lucide-react'
import { HButton } from '../../shared/ui/HButton'
import { HDialog } from '../../shared/ui/HDialog'
import { HInput } from '../../shared/ui/HInput'
import { searchNavigation } from '../searchNavigation'

export function WorkspaceSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = searchNavigation(query)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setQuery('')
  }

  return (
    <HDialog open={open} onOpenChange={changeOpen} title="Rechercher un espace" description="Accédez rapidement aux espaces Horizon."
      onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus() }}
      trigger={<HButton variant="ghost" className="workspace-search"><Search size={16} /><span>Rechercher un espace…</span><kbd>⌘ / Ctrl K</kbd></HButton>}>
      <div className="search-field"><Search size={17} aria-hidden="true" /><HInput ref={inputRef} aria-label="Rechercher un espace" placeholder="Contacts, devis, planning…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="search-results" aria-live="polite">
        {results.length === 0 ? <p className="search-empty">Aucun espace trouvé. Essayez un autre terme.</p> : results.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} to={href} onClick={() => changeOpen(false)} className="search-result">
            <Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="search-footer"><span>Tab pour naviguer</span><span>Échap pour fermer</span></div>
    </HDialog>
  )
}
