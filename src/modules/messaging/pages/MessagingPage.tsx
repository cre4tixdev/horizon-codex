import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Mail, Plus, FilePenLine, Send, CircleCheck, CircleAlert, Clock3, Inbox } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { messagingService } from '../services/MessagingService'
import { useMessagingAccess } from '../hooks/useMessagingAccess'
import { contexts, mailStates, mailTone, type MailMessage } from '../schemas/mail'
import { ReceivedMessages } from '../components/ReceivedMessages'
import { MessageComposer } from '../components/MessageComposer'
export function MessagingPage() {
  const access = useMessagingAccess(), [params, setParams] = useSearchParams(), message = params.get('message') || '', received = params.get('folder') === 'received'
  const data = useQuery({ queryKey: ['messaging', 'list', params.toString()], queryFn: () => messagingService.list(Object.fromEntries(params)), enabled: access.canRead && !received, retry: false, refetchInterval: 10000 })
  const record = useQuery({ queryKey: ['messaging', 'record', message], queryFn: () => messagingService.record(message), enabled: access.canRead && Boolean(message && message !== 'new'), retry: false })
  const sorting = useListTableSorting('-created', { Objet: 'subject', Expéditeur: 'from_address', État: 'status', Date: 'created', Pièce: 'source_label' })
  if (!access.canRead) return <HEmptyState icon={Mail} title="Messagerie" description="Vous ne disposez pas de l’accès aux e-mails Horizon." />
  const close = () => setParams((current) => { const next = new URLSearchParams(current); next.delete('message'); return next }, { replace: true })
  const table = (items: MailMessage[]) => <HDataTable data={items} columnBorders listSorting={sorting} columns={[
    { id: 'Objet', header: 'Objet', accessorKey: 'subject', cell: ({ row }) => <><strong className="h-data-table-record-name">{row.original.subject || 'Sans objet'}</strong><small className="mail-cell-detail">{row.original.to.join(', ') || 'Destinataire à compléter'}</small></> },
    { id: 'Expéditeur', header: 'Expéditeur', accessorKey: 'from_address' },
    { id: 'Pièce', header: 'Pièce', accessorKey: 'source_label' },
    { header: 'État', cell: ({ row }) => <HTag tone={mailTone(row.original.status)}>{mailStates[row.original.status]}</HTag> },
    { header: 'Date', cell: ({ row }) => new Date(row.original.created).toLocaleString('fr-FR') },
  ]} getRowLink={(r) => { const next = new URLSearchParams(params); next.set('message', r.id); return { href: `/messaging?${next}`, label: `Ouvrir l’e-mail ${r.subject || 'Sans objet'}` } }} />
  const folders = [{ value: 'received', label: 'Reçus', icon: Inbox }, { value: '', label: 'Tous les envois', icon: Mail }, { value: 'draft', label: 'Brouillons', icon: FilePenLine }, { value: 'pending,processing', label: 'En attente', icon: Clock3 }, { value: 'sent', label: 'Envoyés', icon: CircleCheck }, { value: 'failed', label: 'Échecs', icon: CircleAlert }, { value: 'uncertain', label: 'À vérifier', icon: Send }]
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Messagerie' }]} /><HPageHeader title="Messagerie" description="Vos envois Horizon et les réponses reçues." actions={access.canWrite && <HButton variant="primary" onClick={() => setParams((v) => { const next = new URLSearchParams(v); next.set('message', 'new'); return next })}><Plus size={14} />Nouvel e-mail</HButton>} />
    <HRecordTabs label="Dossiers e-mail" idPrefix="mail-folders" value={received ? 'received' : folders.some((f) => f.value === (params.get('status') || '')) ? params.get('status') || '' : ''} onChange={(status) => setParams((v) => { const next = new URLSearchParams(v); if (status === 'received') { next.set('folder', 'received'); next.delete('status') } else { next.delete('folder'); if (status) next.set('status', status); else next.delete('status') } for (const key of ['page', 'sort', 'group', 'state', 'message', 'reply']) next.delete(key); return next })} items={folders.map((f) => ({ ...f, panel: 'mail-results' }))} />
    <section id="mail-results" role="tabpanel">{received ? <ReceivedMessages /> : <>{data.error && <p role="alert" className="field-error">{data.error.message}<HButton onClick={() => void data.refetch()}>Réessayer</HButton></p>}{data.isPending && <HLoadingIndicator label="Chargement des e-mails" />}{data.data && <><HListPagination page={data.data.page} totalPages={data.data.totalPages} busy={data.isFetching} label="Pagination des e-mails" onPageChange={(page) => setParams((v) => { const next = new URLSearchParams(v); next.set('page', String(page)); return next })} />{data.data.items.length ? params.get('group') && params.get('group') !== 'none' ? <GroupedResults noun="e-mails" icon={Mail} groups={groupResults(data.data.items, (r) => params.get('group') === 'status' ? { key: r.status, label: mailStates[r.status] } : params.get('group') === 'source_context' ? { key: r.source_context, label: contexts[r.source_context] } : { key: r.from_address, label: r.from_address })} render={table} /> : table(data.data.items) : <HEmptyState icon={Mail} title="Aucun e-mail pour cette sélection" description="Préparez un message libre ou partez d’un devis ou d’une commande fournisseur." />}</>}</>}</section>
    {record.error && <p role="alert" className="field-error">{record.error.message}<HButton onClick={close}>Fermer</HButton></p>}
    {message && (message === 'new' || record.data) && <MessageComposer key={message} record={message === 'new' ? undefined : record.data} context={record.data?.source_context || 'generic'} source={record.data?.source_id || ''} onClose={close} />}
  </div>
}
