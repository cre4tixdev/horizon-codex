import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Barcode, History, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { traceService } from '../services/TraceService'
import { useStockAccess } from '../hooks/useStockAccess'
import type { TraceChoice } from '../schemas/traces'
const labels: Record<string, string> = { active: 'Actif', quarantine: 'Quarantaine', closed: 'Clôturé', stock: 'En stock', transit: 'En transit', delivered: 'Livré', internal: 'Parc interne', scrapped: 'Rebut', returned: 'Retourné', missing: 'Manquant' }
export function ProductTraceability({ product }: { product: string }) {
  const query = useQuery({ queryKey: ['inventory', 'traces', product], queryFn: () => traceService.choices(product), retry: false }), access = useStockAccess()
  const [history, setHistory] = useState<TraceChoice>(), [editing, setEditing] = useState<TraceChoice>()
  return <div><HSectionHeading title="Lots et numéros de série" icon={Barcode} count={query.data?.items.length} />{query.isPending ? <HLoadingIndicator label="Chargement de la traçabilité" /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <HDataTable columnBorders resizable columnAlignments={{ physical: 'center', reserved: 'center', available: 'center', actions: 'center' }} data={query.data?.items || []} columns={[
    { header: 'Numéro', accessorKey: 'number' }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'quarantine' ? 'amber' : row.original.status === 'active' || row.original.status === 'stock' ? 'green' : 'navy'}>{labels[row.original.status] || row.original.status}</HTag> }, { id: 'physical', header: 'Physique', accessorKey: 'physical' }, { id: 'reserved', header: 'Réservé', accessorKey: 'reserved' }, { id: 'available', header: 'Disponible', accessorKey: 'available' }, { header: 'Péremption', accessorKey: 'expiry_date' },
    { id: 'actions', header: 'Actions', cell: ({ row }) => <div className="quote-action-icons"><HButton variant="ghost" size="icon" aria-label={`Historique ${row.original.number}`} title="Historique des mouvements" onClick={() => setHistory(row.original)}><History size={14} /></HButton>{row.original.lot && access.canWrite && <HButton variant="ghost" size="small" onClick={() => setEditing(row.original)}>Gérer</HButton>}</div> },
  ]} />}{query.data && !query.data.items.length && <p className="contact-muted">Les lots / séries apparaîtront à la validation de la première réception.</p>}{history && <TraceHistory product={product} trace={history} onClose={() => setHistory(undefined)} />}{editing && <LotEditor trace={editing} onClose={() => setEditing(undefined)} />}</div>
}
function TraceHistory({ product, trace, onClose }: { product: string; trace: TraceChoice; onClose: () => void }) {
  const [page, setPage] = useState(1), query = useQuery({ queryKey: ['inventory', 'trace-history', product, trace.serial || trace.lot, page], queryFn: () => traceService.history(product, trace.lot, trace.serial, page), retry: false })
  return <HDialog open title={`Historique · ${trace.number}`} description="Entrées, sorties et transferts de cette identité." className="stock-trace-dialog" onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form">{query.error ? <p role="alert" className="field-error">{query.error.message}</p> : query.isPending ? <HLoadingIndicator label="Chargement des mouvements" /> : <HDataTable columnBorders columnAlignments={{ quantity: 'right' }} data={query.data?.items || []} columns={[{ header: 'Date', cell: ({ row }) => new Date(row.original.date).toLocaleDateString('fr-FR') }, { header: 'Pièce', cell: ({ row }) => <Link to={`/inventory/operations/${row.original.operation}`}>{row.original.number}</Link> }, { header: 'Emplacement', accessorKey: 'location' }, { id: 'quantity', header: 'Mouvement', accessorKey: 'quantity' }, { header: 'Par', accessorKey: 'actor' }]} />}<HDialogFooter><HButton variant="ghost" size="icon" aria-label="Historique précédent" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><span>{page} / {query.data?.totalPages || 1}</span><HButton variant="ghost" size="icon" aria-label="Historique suivant" disabled={!query.data || page >= query.data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></HDialogFooter></div></HDialog>
}
function LotEditor({ trace, onClose }: { trace: TraceChoice; onClose: () => void }) {
  const [status, setStatus] = useState(trace.status), [expiry, setExpiry] = useState(trace.expiry_date), client = useQueryClient()
  const mutation = useMutation({ mutationFn: () => traceService.lot(trace.lot, trace.updated, status, expiry), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['inventory'] }); onClose() } })
  return <HDialog open title={`Gérer le lot · ${trace.number}`} description="État et date de péremption du lot." onOpenChange={(open) => { if (!open && !mutation.isPending) onClose() }}><div className="dialog-form"><label><HFieldLabel>État</HFieldLabel><HCombobox label="État du lot" showCodes={false} clearable={false} value={status} options={['active', 'quarantine', 'closed'].map((value) => ({ value, label: labels[value]! }))} onChange={setStatus} /></label><label><HFieldLabel>Péremption</HFieldLabel><HInput type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label><p className="contact-muted">Un lot en quarantaine ne peut pas être réservé ou prélevé. La clôture exige un stock nul.</p>{mutation.error && <p role="alert" className="field-error">{mutation.error.message}</p>}<HDialogFooter><HButton variant="primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}><Check size={14} />Enregistrer</HButton></HDialogFooter></div></HDialog>
}
