import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
type Props = { id: string; title: string; count?: number; icon?: LucideIcon; children: ReactNode }
export function StudioSection(props: Props) { return <Section key={props.id} {...props} /> }
/** Presentation only: folding keeps mounted inputs and their unsaved content. */
function Section({ id, title, count, icon, children }: Props) {
  const contentId = useId(), storageKey = `horizon.documents.studio-section.v2.${id}`
  const [state, setState] = useState(() => { try { return { key: storageKey, open: localStorage.getItem(storageKey) === 'open' } } catch { return { key: storageKey, open: false } } })
  const open = state.key === storageKey ? state.open : false
  return <details className="studio-section" open={open} data-section={id} onToggle={(event) => {
    const next = event.currentTarget.open; if (next === open) return
    setState({ key: storageKey, open: next })
    try { localStorage.setItem(storageKey, next ? 'open' : 'closed') } catch { console.warn('[documents] Section state retained for this session only.') }
  }}><summary aria-controls={contentId}><ChevronDown size={13} aria-hidden="true" /><HSectionHeading title={title} {...(count !== undefined ? { count } : {})} {...(icon ? { icon } : {})} /></summary><div id={contentId} className="studio-section-content">{children}</div></details>
}
