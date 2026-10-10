import { Link } from 'react-router'
import { useSyncExternalStore } from 'react'
import { DropdownMenu } from 'radix-ui'
import { Ellipsis, type LucideIcon } from 'lucide-react'
import { HButton } from './HButton'

export type RecordLink = { id: string; label: string; icon: LucideIcon; count?: number | undefined; href?: string | undefined; description: string; onSelect?: (() => void) | undefined }

function subscribeWidth(onChange: () => void) {
  const media = window.matchMedia('(max-width: 1000px)')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const narrowWidth = () => window.matchMedia('(max-width: 1000px)').matches

export function HRecordLinks({ items, label, busy = false }: { items: readonly RecordLink[]; label: string; busy?: boolean }) {
  const narrow = useSyncExternalStore(subscribeWidth, narrowWidth, () => false)
  if (!items.length) return null
  const limit = narrow ? 2 : 7
  const overflow = items.slice(limit)
  return <nav className="record-links" aria-label={label} aria-busy={busy} inert={busy}>{items.slice(0, limit).map(({ id, label: text, icon: Icon, count, href, description, onSelect }) => {
    const content = <><Icon size={13} aria-hidden="true" /><span>{text}</span><small className="record-link-count">{count === undefined ? '—' : count.toLocaleString('fr-FR')}</small></>
    return href && count !== undefined ? <HButton key={id} asChild size="small" title={description}><Link to={href} onClick={(event) => { if (onSelect && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect() } }}>{content}</Link></HButton> : count !== undefined && onSelect ? <HButton key={id} size="small" title={description} onClick={onSelect}>{content}</HButton> : <HButton key={id} size="small" disabled title={description}>{content}</HButton>
  })}{overflow.length > 0 && <DropdownMenu.Root><DropdownMenu.Trigger asChild><HButton size="small" aria-label="Autres raccourcis" title="Autres raccourcis"><Ellipsis size={14} /></HButton></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="user-menu-content record-links-menu" align="end" sideOffset={6} collisionPadding={12}>{overflow.map(({ id, label: text, icon: Icon, count, href, description, onSelect }) => href && count !== undefined ? <DropdownMenu.Item asChild key={id}><Link to={href} title={description} onClick={(event) => { if (onSelect && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect() } }}><Icon size={14} /><span>{text}</span><small className="record-link-count">{count.toLocaleString('fr-FR')}</small></Link></DropdownMenu.Item> : count !== undefined && onSelect ? <DropdownMenu.Item key={id} onSelect={onSelect} title={description}><Icon size={14} /><span>{text}</span><small className="record-link-count">{count.toLocaleString('fr-FR')}</small></DropdownMenu.Item> : <DropdownMenu.Item key={id} disabled title={description}><Icon size={14} /><span>{text}</span><small className="record-link-count">—</small></DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>}</nav>
}
