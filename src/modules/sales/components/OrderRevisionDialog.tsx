import { SalesDocumentNotices } from './SalesDocumentNotices'
import type { ColumnDef } from '@tanstack/react-table'
import { formatAmount } from '../../../shared/formatters/money'
import { useMutation, useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { displayInstant } from '../../../shared/time/zonedDate'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { salesService } from '../services/SalesService'
import type { Quote, QuoteInput } from '../schemas/quotes'
type RevisionPreview = Awaited<ReturnType<typeof salesService.previewOrderRevision>>
type Change = RevisionPreview['changes'][number]
const columns = (currency: string): ColumnDef<Change>[] => [{ accessorKey: 'label', header: 'Modification' }, ...(['before', 'after'] as const).map((field) => ({ accessorKey: field, header: field === 'before' ? 'Avant' : 'Après', cell: ({ row }: { row: { original: Change } }) => { const value = row.original[field], amount = ['Total HT', 'TVA', 'Total TTC'].includes(row.original.label), display = amount ? formatAmount(Number(value), currency) : value || '—'; return <span className={amount ? 'order-revision-amount' : undefined} title={display}>{display}</span> } }))]
function RevisionChanges({ currency, changes }: { currency: string; changes: Change[] }) {
  return <div className="order-revision-table"><HDataTable columnBorders columnWidths={{ label: '30%', before: '35%', after: '35%' }} columns={columns(currency)} data={changes} /></div>
}
export function OrderRevisionDialog({ record, input, number, onSaved, onClose }: { record: Quote; input: QuoteInput; number: string; onSaved: (record: Quote) => Promise<void>; onClose: () => void }) {
  const preview = useQuery({ queryKey: ['sales', 'order-revision-preview', record.id, record.updated, input, number], queryFn: () => salesService.previewOrderRevision(record.id, record.updated, input, number), retry: false, refetchOnWindowFocus: false })
  const save = useMutation({ mutationFn: () => salesService.reviseOrder(record.id, record.updated, input, number, preview.data!.token), onSuccess: onSaved })
  return <HDialog open title="Enregistrer les modifications de commande" description="Vérifiez les changements et leurs impacts. Le devis accepté et les documents réalisés seront conservés." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} className="order-revision-dialog">
    <div className="dialog-form order-revision-body">
    {preview.isPending && <HLoadingIndicator label="Contrôle des engagements" />}
    {preview.error && <p className="field-error" role="alert">{preview.error.message}</p>}
    {preview.data && <>
      <section><HSectionHeading title="Modifications" /><RevisionChanges currency={record.currency} changes={preview.data.changes} /></section>
      {preview.data.impacts.length > 0 && <section className="contact-panel"><HSectionHeading title="Ajustements des préparations" /><SalesDocumentNotices items={preview.data.impacts} onClosed={() => { save.reset(); void preview.refetch() }} /></section>}
      {preview.data.blocks.length > 0 && <section className="contact-panel"><HSectionHeading title="Documents à traiter avant enregistrement" /><SalesDocumentNotices items={preview.data.blocks} blocking onClosed={() => { save.reset(); void preview.refetch() }} /></section>}
    </>}
    {save.error && <p className="field-error" role="alert">{save.error.message}</p>}
    </div>
    <HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Reprendre l’édition</HButton>{(preview.error || save.error) && <HButton disabled={save.isPending || preview.isFetching} onClick={() => { save.reset(); void preview.refetch() }}>Recalculer les impacts</HButton>}<HButton variant="primary" disabled={!preview.data || preview.isFetching || preview.data.blocks.length > 0 || !preview.data.changes.length || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Enregistrement…' : 'Confirmer les modifications'}</HButton></HDialogFooter>
  </HDialog>
}
export function OrderRevisionHistory({ order, onClose }: { order: string; onClose: () => void }) {
  const history = useQuery({ queryKey: ['sales', 'order-revisions', order], queryFn: () => salesService.orderRevisions(order), retry: false })
  return <HDialog open title="Révisions de la commande" description="Historique des changements validés, avec auteur et date." onOpenChange={(open) => { if (!open) onClose() }} className="order-revision-dialog">
    <div className="dialog-form order-revision-body">
    {history.isPending && <HLoadingIndicator label="Chargement des révisions" />}{history.error && <p className="field-error" role="alert">{history.error.message}</p>}
    {history.data && !history.data.items.length && <HEmptyState icon={History} title="Aucune révision" description="Les modifications validées de cette commande apparaîtront ici." />}
    {history.data?.items.map((revision) => <section className="contact-panel" key={revision.id}><HSectionHeading title={`Révision ${revision.number}`} description={`Par ${revision.author} · ${displayInstant(revision.created)}`} icon={History} /><RevisionChanges currency={revision.currency} changes={revision.changes} />{revision.impacts.length > 0 && <div className="h-record-lines"><HSectionHeading title="Pièces et impacts" /><SalesDocumentNotices items={revision.impacts} onClosed={() => { void history.refetch() }} /></div>}</section>)}
    </div>
    <HDialogFooter><HButton onClick={onClose}>Fermer</HButton></HDialogFooter>
  </HDialog>
}
