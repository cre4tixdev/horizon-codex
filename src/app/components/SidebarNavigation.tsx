import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { HButton } from '../../shared/ui/HButton'
import { SidebarItem } from './SidebarItem'
import type { NavigationGroup } from '../navigation'

const narrowSidebar = () => window.matchMedia('(max-width: 700px)').matches
const subscribeWidth = (changed: () => void) => {
  const media = window.matchMedia('(max-width: 700px)')
  media.addEventListener('change', changed)
  return () => media.removeEventListener('change', changed)
}

export function SidebarNavigation({ groups, preferenceKey, brand, compact = false }: { groups: NavigationGroup[]; preferenceKey: string; brand: ReactNode; compact?: boolean }) {
  const mobile = useSyncExternalStore(subscribeWidth, narrowSidebar, () => false)
  const id = useId()
  const [folded, setFolded] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(preferenceKey) || '[]')
      return Array.isArray(saved) ? saved.filter((label): label is string => typeof label === 'string') : []
    } catch { console.warn('[navigation] Préférence de sections indisponible.'); return [] }
  })
  useEffect(() => {
    try { localStorage.setItem(preferenceKey, JSON.stringify(folded)) }
    catch { console.warn('[navigation] Préférence de sections non mémorisée.') }
  }, [folded, preferenceKey])
  const allFolded = groups.length > 0 && groups.every((group) => folded.includes(group.label))
  const AllIcon = allFolded ? ChevronsUpDown : ChevronsDownUp
  return <><div className="sidebar-header">{brand}<HButton variant="ghost" size="icon" className="sidebar-sections-toggle" title={allFolded ? 'Déplier toutes les sections' : 'Replier toutes les sections'} aria-label={allFolded ? 'Déplier toutes les sections' : 'Replier toutes les sections'} onClick={() => setFolded((current) => allFolded ? current.filter((label) => !groups.some((group) => group.label === label)) : [...new Set([...current, ...groups.map((group) => group.label)])])}><AllIcon size={16} aria-hidden="true" /></HButton></div>
    <nav className="sidebar-nav" aria-label="Navigation principale">
    {groups.map((group, index) => {
      const expanded = !folded.includes(group.label), controls = `${id}-section-${index}`
      return <div className="sidebar-group" key={group.label}>
        <button type="button" className="sidebar-group__title sidebar-group-toggle" aria-label={`${expanded ? 'Replier' : 'Déplier'} la section ${group.label}`} aria-expanded={expanded} aria-controls={controls} onClick={() => setFolded((current) => expanded ? [...current, group.label] : current.filter((label) => label !== group.label))}><span className="sidebar-group-label"><span className="sidebar-group-name">{group.label}</span>{!expanded && <span className="sidebar-group-count" aria-hidden="true">· {group.items.length}</span>}</span><ChevronRight size={12} aria-hidden="true" /></button>
        <div id={controls} className="sidebar-group__items" hidden={!expanded && !compact && !mobile}>{group.items.map((item) => <SidebarItem key={item.href} item={item} />)}</div>
      </div>
    })}
  </nav></>
}
