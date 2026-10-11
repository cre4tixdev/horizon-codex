import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PackageCheck } from 'lucide-react'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { stockService } from '../services/StockService'
import type { StockSelection, ReservationChoices } from '../schemas/stock'
export function StockReservations({ quote, busy, optional = false, onChange }: { quote: string; busy: boolean; optional?: boolean; onChange: (selections: StockSelection[], revision: string) => void }) {
  const query = useQuery({ queryKey: ['inventory', 'reservations', quote], queryFn: () => stockService.reservations(quote), retry: false })
  if (!query.data) return query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Vérification du stock disponible" />
  return <ReservationRows key={query.data.revision} choices={query.data} busy={busy} optional={optional} onChange={onChange} />
}
function ReservationRows({ choices, busy, optional, onChange }: { choices: ReservationChoices; busy: boolean; optional: boolean; onChange: (selections: StockSelection[], revision: string) => void }) {
  const [enabled, setEnabled] = useState(!optional), [selections, setSelections] = useState<Record<string, StockSelection>>(() => Object.fromEntries(choices.lines.flatMap((line) => line.selected.map((item) => [line.source_line + '-' + item.location, { ...item, source_line: line.source_line }]))))
  useEffect(() => { onChange(enabled ? Object.values(selections) : [], choices.revision) }, [enabled, selections, choices.revision, onChange])
  const rows = choices.lines.flatMap((line) => line.locations.map((location) => ({ ...line, ...location, id: line.source_line + '-' + location.id, location: location.id })))
  return <section className="stock-reservations"><label className="stock-reservation-heading">{optional && <input type="checkbox" disabled={busy} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}<PackageCheck size={16} />{optional ? 'Réserver le stock disponible' : 'Réservations de la commande'}</label>
    {optional && !enabled && <p className="contact-muted">Vous pourrez réserver le stock depuis la commande après confirmation.</p>}
    {enabled && <div className="stock-reservation-lines"><HDataTable columnBorders data={rows} columns={[
      { id: 'checked', header: '', size: 30, cell: ({ row }) => <input type="checkbox" aria-label={`Réserver ${row.original.description} · ${row.original.name}`} checked={Boolean(selections[row.original.id])} disabled={busy || !row.original.reservable || row.original.available <= 0 || row.original.capacity <= 0} onChange={(e) => setSelections((current) => { const next = { ...current }; if (e.target.checked) next[row.original.id] = { source_line: row.original.source_line, location: row.original.location, quantity: Math.min(row.original.available, Math.max(0, row.original.capacity - Object.values(next).filter((item) => item.source_line === row.original.source_line).reduce((sum, item) => sum + item.quantity, 0))) }; else delete next[row.original.id]; return next })} /> },
      { header: 'Produit / ligne', accessorKey: 'description' }, { header: 'Emplacement', accessorKey: 'name' }, { header: 'Disponible', cell: ({ row }) => `${row.original.available} ${row.original.unit}` }, { header: 'À couvrir', cell: ({ row }) => `${row.original.capacity} ${row.original.unit}` },
      { header: 'À réserver', cell: ({ row }) => <HInput type="number" step="any" min="0.000001" max={Math.min(row.original.capacity, row.original.available)} disabled={busy || !selections[row.original.id]} aria-label={`Quantité réservée ${row.original.description} · ${row.original.name}`} value={selections[row.original.id]?.quantity || 0} onChange={(e) => setSelections((current) => ({ ...current, [row.original.id]: { ...current[row.original.id]!, quantity: e.target.valueAsNumber } }))} /> },
    ]} />{!rows.length && <p className="contact-muted">Aucune ligne stockable à réserver.</p>}{choices.lines.some((line) => !line.reservable) && <p className="contact-muted">Les produits suivis par lot ou série nécessitent le prochain lot de traçabilité.</p>}</div>}
  </section>
}
export function StockReservationDialog({ quote, onClose }: { quote: string; onClose: () => void }) {
  const client = useQueryClient(), [selection, setSelection] = useState({ selections: [] as StockSelection[], revision: '' })
  const save = useMutation({ mutationFn: () => stockService.reserve(quote, selection.revision, selection.selections), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['inventory'] }), client.invalidateQueries({ queryKey: ['purchasing'] }), client.invalidateQueries({ queryKey: ['activity'] })]); onClose() } })
  // Stable callback prevents the editor from reinitialising during quantity entry.
  const [update] = useState(() => (selections: StockSelection[], revision: string) => setSelection({ selections, revision }))
  return <HDialog open title="Réserver le stock" className="quote-stock-confirmation" description="Le stock réservé reste physiquement en entrepôt. Seule une livraison validée le sortira du stock." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><StockReservations quote={quote} busy={save.isPending} onChange={update} />{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<HDialogFooter><HButton variant="primary" disabled={save.isPending || !selection.revision} onClick={() => save.mutate()}><PackageCheck size={14} />Enregistrer les réservations</HButton></HDialogFooter></HDialog>
}
