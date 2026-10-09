import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, Layers, Library, Link2, LayoutGrid, Move, Type, Table2, Palette, Image, FileText, Heading, type LucideIcon } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
const sectionIcons: Record<string, LucideIcon> = { library: Library, layers: Layers, 'page-format': FileText, 'page-background': Image, placement: LayoutGrid, geometry: Move, 'text-content': Type, binding: Link2, image: Image, 'table-data': Table2, 'table-headings': Heading, appearance: Palette }
type Props = { id: string; title: string; count?: number; icon?: LucideIcon; children: ReactNode }
export function StudioSection(props: Props) { return <Section key={props.id} {...props} /> }
/** Presentation only: folding keeps mounted inputs and their unsaved content. */
function Section({ id, title, count, icon, children }: Props) {
  const sectionIcon = icon || sectionIcons[id]
  const contentId = useId(), storageKey = `horizon.documents.studio-section.v2.${id}`
  const [state, setState] = useState(() => { try { return { key: storageKey, open: localStorage.getItem(storageKey) === 'open' } } catch { return { key: storageKey, open: false } } })
  const open = state.key === storageKey ? state.open : false
  return <details className="studio-section" open={open} data-section={id} onToggle={(event) => {
    const next = event.currentTarget.open; if (next === open) return
    setState({ key: storageKey, open: next })
    try { localStorage.setItem(storageKey, next ? 'open' : 'closed') } catch { console.warn('[documents] Section state retained for this session only.') }
  }}><summary aria-controls={contentId}><ChevronDown size={13} aria-hidden="true" /><HSectionHeading title={title} {...(count !== undefined ? { count } : {})} {...(sectionIcon ? { icon: sectionIcon } : {})} /></summary><div id={contentId} className="studio-section-content">{children}</div></details>
}
