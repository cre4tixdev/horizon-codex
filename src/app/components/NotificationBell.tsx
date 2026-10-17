import { Link } from 'react-router'
import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Popover } from 'radix-ui'
import { Bell, Check, Settings2, X } from 'lucide-react'
import { sessionService, isLayoutPreview } from '../../core/auth/services/session'
import { notificationService } from '../../core/notifications/services/NotificationService'
import { activitySourcePaths } from '../../core/activity/types/activity'
import { HButton } from '../../shared/ui/HButton'
const sourceHref = (entity: string, id: string) => { const prefix = Object.entries(activitySourcePaths).find(([key]) => key === entity)?.[1]; return prefix && /^[a-z0-9]{15}$/.test(id) ? `${prefix}${id}` : '' }
type Action = { kind: 'read' | 'dismiss'; id: string } | { kind: 'dismiss-read' }
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot), enabled = session.status === 'authenticated', client = useQueryClient()
  const key = ['notifications', enabled ? session.user.id : 'preview']
  const inbox = useQuery({ queryKey: key, queryFn: () => notificationService.inbox(), enabled, retry: false, refetchInterval: 30_000 })
  const action = useMutation({ mutationFn: (input: Action) => input.kind === 'dismiss-read' ? notificationService.dismissRead() : input.kind === 'dismiss' ? notificationService.dismiss(input.id) : notificationService.markRead(input.id), onSuccess: () => client.invalidateQueries({ queryKey: key }) })
  const count = inbox.data?.unread ?? 0, unreadLabel = `${count} non ${count === 1 ? 'lue' : 'lues'}`
  return <Popover.Root open={open} onOpenChange={(value) => { setOpen(value); action.reset(); if (value && enabled) void inbox.refetch() }}>
    <Popover.Trigger asChild><HButton variant="ghost" size="icon" className="notification-bell" aria-label={`Notifications${count ? `, ${unreadLabel}` : ''}`}><Bell size={19} />{count > 0 && <span className="notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}{inbox.isError && <span className="notification-unavailable" aria-hidden="true">!</span>}</HButton></Popover.Trigger>
    <Popover.Portal><Popover.Content className="notification-panel" align="end" sideOffset={10} collisionPadding={12} aria-label="Notifications">
      <div className="notification-heading"><strong>Notifications</strong><span>{unreadLabel}</span>{enabled && <HButton asChild variant="ghost" size="icon"><Link to="/account?tab=notifications" title="Préférences de notifications" aria-label="Préférences de notifications" onClick={() => setOpen(false)}><Settings2 size={15} /></Link></HButton>}</div>
      {inbox.data?.items.some((item) => item.read_at) && <div className="notification-toolbar"><HButton variant="ghost" size="small" disabled={action.isPending} onClick={() => action.mutate({ kind: 'dismiss-read' })}>Retirer les notifications lues</HButton></div>}
      {inbox.isError ? <div className="notification-empty"><p role="alert">{inbox.error.message}</p><HButton size="small" onClick={() => void inbox.refetch()}>Réessayer</HButton></div> : inbox.isPending && !isLayoutPreview ? <p className="notification-empty">Consultation des notifications…</p> : !inbox.data?.items.length ? <div className="notification-empty"><Bell size={26} /><strong>Vous êtes à jour</strong><p>Aucune notification pour le moment.</p></div> : <ul className="notification-items">{inbox.data.items.map((item) => { const href = sourceHref(item.source_entity, item.source_record_id); return <li key={item.id} className={item.read_at ? '' : 'notification-item--unread'}><div><strong>{item.title}</strong>{item.body && <p>{item.body}</p>}<small>{new Date(item.created).toLocaleString('fr-FR')}</small>{href && <Link className="notification-source-link" to={href} onClick={() => setOpen(false)}>Voir la fiche</Link>}</div><span className="notification-item-actions">{!item.read_at && <HButton variant="ghost" size="icon" title="Marquer comme lue" aria-label={`Marquer comme lue : ${item.title}`} disabled={action.isPending} onClick={() => action.mutate({ kind: 'read', id: item.id })}><Check size={16} /></HButton>}<HButton variant="ghost" size="icon" title="Retirer de la liste" aria-label={`Retirer : ${item.title}`} disabled={action.isPending} onClick={() => action.mutate({ kind: 'dismiss', id: item.id })}><X size={15} /></HButton></span></li> })}</ul>}
      {action.error && <p role="alert" className="notification-error">{action.error.message}</p>}
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
