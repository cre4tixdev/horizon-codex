import { useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Mail, Paperclip } from 'lucide-react'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HAttachmentWorkspace } from '../../../shared/ui/HAttachmentWorkspace'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { messagingService } from '../services/MessagingService'
import { contexts, type MailReplySummary } from '../schemas/mail'

function ReplyDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [tab, setTab] = useState('message'), [selected, setSelected] = useState('')
  const record = useQuery({ queryKey: ['messaging', 'reply', id], queryFn: () => messagingService.reply(id), retry: false })
  const reply = record.data, filename = selected || reply?.attachments[0] || ''
  const file = useQuery({ queryKey: ['messaging', 'reply-file', id, filename], queryFn: async () => { const blob = await messagingService.replyAttachment(id, filename); return new File([blob], filename, { type: blob.type }) }, enabled: Boolean(reply && filename && tab === 'files'), retry: false, gcTime: 0 })
  const href = reply ? `${reply.source_context === 'sales_quote' ? '/sales/quotes' : '/purchasing/orders'}/${reply.source_id}` : ''
  return <HDialog open title={reply?.subject || 'E-mail reçu'} description="Réponse à un envoi Horizon" className="mail-composer-dialog" onOpenChange={(open) => { if (!open) onClose() }}>
    {record.isPending && <HLoadingIndicator label="Chargement de la réponse" />}
    {record.error && <div className="dialog-form"><p className="field-error" role="alert">{record.error.message}</p><HButton onClick={() => void record.refetch()}>Réessayer</HButton></div>}
    {reply && <div className="dialog-form mail-composer-form">
      <HRecordTabs label="Contenu de la réponse" idPrefix="mail-reply" value={tab} onChange={setTab} items={[{ value: 'message', label: 'Message', icon: Mail, panel: 'reply-message' }, { value: 'files', label: 'Pièces jointes', count: reply.attachments.length, icon: Paperclip, panel: 'reply-files' }]} />
      <section id="reply-message" role="tabpanel" aria-labelledby="mail-reply-message" hidden={tab !== 'message'} className="mail-composer-content">
        <dl className="mail-reply-details"><div><dt>De</dt><dd>{reply.sender_name ? `${reply.sender_name} <${reply.sender_address}>` : reply.sender_address}</dd></div><div><dt>À</dt><dd>{reply.to_address}</dd></div><div><dt>Reçu le</dt><dd>{new Date(reply.received_at).toLocaleString('fr-FR')}</dd></div><div><dt>Pièce liée</dt><dd><Link to={href}>{contexts[reply.source_context]} · {reply.source_label}</Link></dd></div></dl>
        <div className="mail-reply-body">{reply.body_text || 'Ce message ne contient pas de texte.'}</div>
        {reply.warnings.map((warning, index) => <p className="field-error" key={index}>{warning}</p>)}
      </section>
      <section id="reply-files" role="tabpanel" aria-labelledby="mail-reply-files" hidden={tab !== 'files'} className="mail-composer-files">
        {reply.attachments.length ? <><HAttachmentWorkspace files={reply.attachments.map((name) => ({ id: name, name, pdf: /\.pdf$/i.test(name), source: filename === name ? file.data : undefined, removable: false }))} selectedId={filename} onSelect={setSelected} loading={file.isFetching} error={file.error?.message} />{file.error && <HButton onClick={() => void file.refetch()}>Réessayer</HButton>}</> : <HEmptyState icon={Paperclip} title="Aucune pièce jointe" description="Cette réponse ne contient pas de pièce jointe importée." />}
      </section>
    </div>}
    <HDialogFooter>{reply && <HButton asChild><Link to={href}>Ouvrir {reply.source_context === 'sales_quote' ? 'le devis' : 'la commande'}</Link></HButton>}<HButton onClick={onClose}>Fermer</HButton></HDialogFooter>
  </HDialog>
}
export function ReceivedMessages() {
  const [params, setParams] = useSearchParams(), reply = params.get('reply') || ''
  const criteria = new URLSearchParams(params); criteria.delete('reply'); criteria.delete('message')
  const query = useQuery({ queryKey: ['messaging', 'replies', criteria.toString()], queryFn: () => messagingService.replies(Object.fromEntries(criteria)), retry: false, refetchInterval: 10000, placeholderData: keepPreviousListData(['messaging', 'replies']) })
  const sorting = useListTableSorting('-received_at', { Objet: 'subject', Expéditeur: 'sender_address', Pièce: 'source_label', Date: 'received_at' })
  const close = () => setParams((current) => { const next = new URLSearchParams(current); next.delete('reply'); return next }, { replace: true })
  const table = (items: MailReplySummary[]) => <HDataTable data={items} columnBorders listSorting={sorting} columns={[
    { id: 'Objet', header: 'Objet', accessorKey: 'subject', cell: ({ row }) => <strong className="h-data-table-record-name">{row.original.subject || 'Sans objet'}</strong> },
    { id: 'Expéditeur', header: 'Expéditeur', accessorKey: 'sender_address', cell: ({ row }) => <>{row.original.sender_name || row.original.sender_address}{row.original.sender_name && <small className="mail-cell-detail">{row.original.sender_address}</small>}</> },
    { id: 'Pièce', header: 'Pièce', accessorKey: 'source_label', cell: ({ row }) => <>{contexts[row.original.source_context]} · {row.original.source_label}</> },
    { id: 'Date', header: 'Date', accessorKey: 'received_at', cell: ({ row }) => new Date(row.original.received_at).toLocaleString('fr-FR') },
  ]} getRowLink={(row) => { const next = new URLSearchParams(params); next.set('reply', row.id); return { href: `/messaging?${next}`, label: `Ouvrir la réponse ${row.subject || 'Sans objet'}` } }} />
  return <>
    {query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.isPending && <HLoadingIndicator label="Chargement des réponses reçues" />}
    {query.data && <><HListPagination page={query.data.page} totalPages={query.data.totalPages} busy={query.isFetching} label="Pagination des réponses" onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} />{query.data.items.length ? params.get('group') && params.get('group') !== 'none' ? <GroupedResults noun="réponses" icon={Mail} groups={groupResults(query.data.items, (item) => params.get('group') === 'source_context' ? { key: item.source_context, label: contexts[item.source_context] } : { key: item.sender_address, label: item.sender_name || item.sender_address })} render={table} /> : table(query.data.items) : <HEmptyState icon={Mail} title="Aucune réponse pour cette sélection" description="Les réponses reçues à vos devis et commandes envoyés depuis Horizon apparaissent ici après leur relève." />}</>}
    {reply && <ReplyDialog key={reply} id={reply} onClose={close} />}
  </>
}
