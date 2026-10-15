import type { ColumnDef } from '@tanstack/react-table'
import { formatAmount } from '../../../shared/formatters/money'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { salesService } from '../services/SalesService'
import type { Quote, QuoteInput } from '../schemas/quotes'
function RevisionDocumentLink({ href, label, onClosed }: { href: string; label: string; onClosed: () => void }) {
  const open = useRecordWorkspace(), button = useRef<HTMLButtonElement>(null), [error, setError] = useState('')
  const match = /^(\/inventory\/operations|\/purchasing\/requests|\/purchasing\/orders|\/billing\/(customer|supplier|customer_credit|supplier_credit))\/([a-z0-9]{15})$/.exec(href)
  if (!match || !open) return null
  const resource = match[2] ? `billing-${match[2]}` : ({ '/inventory/operations': 'stock-operation', '/purchasing/requests': 'purchase-request', '/purchasing/orders': 'purchase-order' })[match[1]!]
  async function inspect() {
    setError('')
    try { await open!({ resource: resource!, id: match![3]!, returnFocus: () => button.current?.focus() }); onClosed() }
    catch (cause) { console.error('[sales] Document inspection failed'); setError(cause instanceof Error ? cause.message : 'La pièce ne peut pas être ouverte.') }
  }
  return <><HButton ref={button} size="small" variant="ghost" onClick={() => void inspect()} aria-label={label.startsWith('Ouvrir ') ? label : `Ouvrir ${label}`}>{label}<ArrowUpRight size={14} /></HButton>{error && <span role="alert" className="field-error">{error}</span>}</>
}
type Change = { label: string; before: string; after: string }
const columns = (currency: string): ColumnDef<Change>[] => [{ accessorKey: 'label', header: 'Modification' }, ...(['before', 'after'] as const).map((field) => ({ accessorKey: field, header: field === 'before' ? 'Avant' : 'Après', cell: ({ row }: { row: { original: Change } }) => { const value = row.original[field], display = ['Total HT', 'TVA', 'Total TTC'].includes(row.original.label) ? formatAmount(Number(value), currency) : value; return <span title={display}>{display}</span> } }))]
export function OrderRevisionDialog({ record, input, number, onSaved, onClose }: { record: Quote; input: QuoteInput; number: string; onSaved: (record: Quote) => Promise<void>; onClose: () => void }) {
  const preview = useQuery({ queryKey: ['sales', 'order-revision-preview', record.id, record.updated, input, number], queryFn: () => salesService.previewOrderRevision(record.id, record.updated, input, number), retry: false, refetchOnWindowFocus: false })
  const save = useMutation({ mutationFn: () => salesService.reviseOrder(record.id, record.updated, input, number, preview.data!.token), onSuccess: onSaved })
  return <HDialog open title="Enregistrer les modifications de commande" description="Vérifiez les changements et leurs impacts. Le devis accepté et les documents réalisés seront conservés." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} className="dialog-form">
    {preview.isPending && <HLoadingIndicator label="Contrôle des engagements" />}
    {preview.error && <p className="field-error" role="alert">{preview.error.message}</p>}
    {preview.data && <>
      <HDataTable columns={columns(record.currency)} data={preview.data.changes} />
      {preview.data.impacts.length > 0 && <section className="contact-panel"><HSectionHeading title="Ajustements des préparations" />{preview.data.impacts.map((impact, index) => <p key={index}>{impact.message} {impact.href && <RevisionDocumentLink href={impact.href} label={impact.label} onClosed={() => { save.reset(); void preview.refetch() }} />}</p>)}</section>}
      {preview.data.blocks.length > 0 && <section className="contact-panel"><HSectionHeading title="Documents à traiter avant enregistrement" />{preview.data.blocks.map((block, index) => <p key={index} role="alert" className="field-error">{block.message} {block.href && <RevisionDocumentLink href={block.href} label={block.label} onClosed={() => { save.reset(); void preview.refetch() }} />}</p>)}</section>}
    </>}
    {save.error && <p className="field-error" role="alert">{save.error.message}</p>}
    <HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Reprendre l’édition</HButton>{(preview.error || save.error) && <HButton disabled={save.isPending || preview.isFetching} onClick={() => { save.reset(); void preview.refetch() }}>Recalculer les impacts</HButton>}<HButton variant="primary" disabled={!preview.data || preview.isFetching || preview.data.blocks.length > 0 || !preview.data.changes.length || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Enregistrement…' : 'Confirmer les modifications'}</HButton></HDialogFooter>
  </HDialog>
}
export function OrderRevisionHistory({ order, onClose }: { order: string; onClose: () => void }) {
  const history = useQuery({ queryKey: ['sales', 'order-revisions', order], queryFn: () => salesService.orderRevisions(order), retry: false })
  return <HDialog open title="Révisions de la commande" description="Historique des changements validés, avec auteur et date." onOpenChange={(open) => { if (!open) onClose() }} className="dialog-form">
    {history.isPending && <HLoadingIndicator label="Chargement des révisions" />}{history.error && <p className="field-error" role="alert">{history.error.message}</p>}
    {history.data?.items.map((revision) => <section className="contact-panel" key={revision.id}><HSectionHeading title={`Révision ${revision.number} · ${revision.author}`} /><p className="contact-muted">{new Date(revision.created).toLocaleString('fr-FR')}</p><HDataTable columns={columns(revision.currency)} data={revision.changes} />{revision.impacts.map((impact, index) => <p key={index}>{impact.message} {impact.href && <RevisionDocumentLink href={impact.href} label={impact.label} onClosed={() => { void history.refetch() }} />}</p>)}</section>)}
    <HDialogFooter><HButton onClick={onClose}>Fermer</HButton></HDialogFooter>
  </HDialog>
}
