import { Link } from 'react-router'
import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Popover } from 'radix-ui'
import { Bell, Check } from 'lucide-react'
import { sessionService, isLayoutPreview } from '../../core/auth/services/session'
import { notificationService } from '../../core/notifications/services/NotificationService'
import { HButton } from '../../shared/ui/HButton'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const enabled = session.status === 'authenticated'
  const client = useQueryClient()
  const key = ['notifications', enabled ? session.user.id : 'preview']
  const inbox = useQuery({ queryKey: key, queryFn: () => notificationService.inbox(), enabled, retry: false, refetchInterval: 30_000 })
  const read = useMutation({ mutationFn: (id: string) => notificationService.markRead(id), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) })
  const count = inbox.data?.unread ?? 0
  const unreadLabel = `${count} non ${count === 1 ? 'lue' : 'lues'}`
  return <Popover.Root open={open} onOpenChange={(value) => { setOpen(value); read.reset(); if (value && enabled) void inbox.refetch() }}>
    <Popover.Trigger asChild><HButton variant="ghost" size="icon" className="notification-bell" aria-label={`Notifications${count ? `, ${unreadLabel}` : ''}`}><Bell size={19} />{count > 0 && <span className="notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}{inbox.isError && <span className="notification-unavailable" aria-hidden="true">!</span>}</HButton></Popover.Trigger>
    <Popover.Portal><Popover.Content className="notification-panel" align="end" sideOffset={10} collisionPadding={12} aria-label="Notifications">
      <div className="notification-heading"><strong>Notifications</strong><span>{unreadLabel}</span></div>
      {inbox.isError ? <div className="notification-empty"><p role="alert">{inbox.error.message}</p><HButton size="small" onClick={() => void inbox.refetch()}>Réessayer</HButton></div> : inbox.isPending && !isLayoutPreview ? <p className="notification-empty">Consultation des notifications…</p> : !inbox.data?.items.length ? <div className="notification-empty"><Bell size={26} /><strong>Vous êtes à jour</strong><p>Aucune notification pour le moment.</p></div> : <ul className="notification-items">{inbox.data.items.map((item) => <li key={item.id} className={item.read_at ? '' : 'notification-item--unread'}><div><strong>{item.title}</strong>{item.body && <p>{item.body}</p>}<small>{new Date(item.created).toLocaleString('fr-FR')}</small>{['contacts_companies', 'contacts_people', 'crm_opportunities', 'crm_tenders', 'sales_quotes'].includes(item.source_entity) && /^[a-z0-9]{15}$/.test(item.source_record_id) && <Link className="notification-source-link" to={item.source_entity === 'sales_quotes' ? `/sales/quotes/${item.source_record_id}#activity` : item.source_entity.startsWith('crm_') ? `/crm/${item.source_entity === 'crm_tenders' ? 'tenders' : 'opportunities'}/${item.source_record_id}#activity` : `/contacts/${item.source_entity === 'contacts_companies' ? 'companies' : 'people'}/${item.source_record_id}#activity`} onClick={() => setOpen(false)}>Voir la fiche</Link>}</div>{!item.read_at && <HButton variant="ghost" size="icon" aria-label={`Marquer comme lue : ${item.title}`} disabled={read.isPending} onClick={() => read.mutate(item.id)}><Check size={16} /></HButton>}</li>)}</ul>}
      {read.isError && <p role="alert" className="notification-error">{read.error.message}</p>}
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
