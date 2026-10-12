import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { TraceChoice } from '../schemas/traces'
import { createContext, useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Barcode, Check } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { traceService } from '../services/TraceService'
import type { OperationLine, StockTrace } from '../schemas/operations'
type TraceEditor = { editable: boolean; incoming: boolean; serial: boolean; allowUnavailable: boolean; items: TraceChoice[]; unit: string; set: (index: number, value: Partial<StockTrace>) => void; remove: (index: number) => void }
const TraceContext = createContext<TraceEditor | undefined>(undefined)
function TraceNumberCell({ row }: CellContext<StockTrace, unknown>) {
  const editor = useContext(TraceContext)!
  return editor.editable ? editor.incoming ? <HInput aria-label={`Numéro ${row.index + 1}`} maxLength={160} value={row.original.number} onChange={(event) => editor.set(row.index, { lot: '', serial: '', number: event.target.value })} /> : <HCombobox showCodes={false} clearable={false} label={`Identité ${row.index + 1}`} value={row.original.serial || row.original.lot} options={editor.items.map((trace) => ({ value: trace.serial || trace.lot, label: `${trace.number} · ${trace.physical} ${editor.unit}`, disabled: !editor.allowUnavailable && (trace.physical <= 0 || trace.status === 'quarantine' || trace.status === 'closed') }))} onChange={(id) => { const item = editor.items.find((trace) => trace.serial === id || trace.lot === id); if (item) editor.set(row.index, { lot: item.lot, serial: item.serial, number: item.number, expiry_date: item.expiry_date }) }} /> : row.original.number
}
function TraceQuantityCell({ row }: CellContext<StockTrace, unknown>) { const editor = useContext(TraceContext)!; return <HInput type="number" min={0.000001} step="any" aria-label={`Quantité identité ${row.index + 1}`} readOnly={!editor.editable || editor.serial} value={row.original.quantity} onChange={(event) => editor.set(row.index, { quantity: event.target.valueAsNumber })} /> }
function TraceExpiryCell({ row }: CellContext<StockTrace, unknown>) { const editor = useContext(TraceContext)!; return <HInput type="date" aria-label={`Péremption lot ${row.index + 1}`} readOnly={!editor.editable} value={row.original.expiry_date} onChange={(event) => editor.set(row.index, { expiry_date: event.target.value })} /> }
function TraceActionCell({ row }: CellContext<StockTrace, unknown>) { const editor = useContext(TraceContext)!; return editor.editable && <HButton variant="ghost" size="icon" aria-label={`Retirer identité ${row.index + 1}`} onClick={() => editor.remove(row.index)}><Trash2 size={14} /></HButton> }
const traceColumns: ColumnDef<StockTrace>[] = [{ id: 'number', header: 'Numéro', cell: TraceNumberCell }, { id: 'quantity', header: 'Quantité', cell: TraceQuantityCell }, { id: 'expiry', header: 'Péremption', cell: TraceExpiryCell }, { id: 'actions', header: '', cell: TraceActionCell }]
export function TracePicker({ line, incoming, allowUnavailable = false, editable, onSave, onClose }: { line: OperationLine; incoming: boolean; allowUnavailable?: boolean; editable: boolean; onSave: (traces: StockTrace[]) => void; onClose: () => void }) {
  const [traces, setTraces] = useState<StockTrace[]>(line.traces.length ? line.traces : incoming ? [{ lot: '', serial: '', number: '', quantity: line.tracking === 'serial' ? 1 : line.quantity, expiry_date: '' }] : [])
  const query = useQuery({ queryKey: ['inventory', 'traces', line.product, incoming ? '' : line.from_location], queryFn: () => traceService.choices(line.product, incoming ? '' : line.from_location), retry: false })
  const serial = line.tracking === 'serial', total = traces.reduce((sum, trace) => sum + trace.quantity, 0), valid = Math.abs(total - line.quantity) < 0.000001 && traces.length > 0 && traces.every((trace) => trace.number.trim() && trace.quantity > 0 && (!serial || trace.quantity === 1))
  function set(index: number, value: Partial<StockTrace>) { setTraces((rows) => rows.map((row, i) => i === index ? { ...row, ...value } : row)) }
  return <HDialog open title={serial ? 'Numéros de série' : 'Lots réceptionnés / prélevés'} description={`${line.description} · ${total} / ${line.quantity} ${line.unit}`} className="stock-trace-dialog" onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form">
    {query.isPending ? <HLoadingIndicator label="Chargement des identités" /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <>
      <TraceContext value={{ editable, incoming, serial, allowUnavailable, unit: line.unit, items: query.data?.items || [], set, remove: (index) => setTraces((rows) => rows.filter((_, i) => i !== index)) }}><HDataTable columnBorders columnAlignments={{ quantity: 'center', actions: 'center' }} data={traces} columns={traceColumns.filter((column) => column.id !== 'expiry' || !serial && incoming)} /></TraceContext>
      {editable && <HButton variant="ghost" size="small" onClick={() => setTraces((rows) => [...rows, { lot: '', serial: '', number: '', quantity: serial ? 1 : Math.max(1, line.quantity - total), expiry_date: '' }])}><Plus size={14} />{serial ? 'Ajouter un numéro' : 'Ajouter un lot'}</HButton>}
      <p className="contact-muted"><Barcode size={14} />{serial ? 'Un numéro unique par exemplaire. Les numéros sont créés à la validation de la réception.' : 'Répartissez la quantité entre les lots. Les prélèvements conservent le lot d’origine.'}</p>
    </>}
    <HDialogFooter>{editable && <HButton variant="primary" disabled={!valid || !query.data} onClick={() => { onSave(traces); onClose() }}><Check size={14} />Appliquer</HButton>}</HDialogFooter>
  </div></HDialog>
}
