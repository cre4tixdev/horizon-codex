import { HDataTable } from '../../../shared/ui/HDataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Plus, Trash2, ChartBar } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import type { PurchaseChoices, PurchaseLineInput } from '../schemas/purchasing'
export function AllocationDialog({ line, fallback, choices, editable, onClose, onSave }: { line: PurchaseLineInput; fallback: string; choices: PurchaseChoices; editable: boolean; onClose: () => void; onSave: (allocations: PurchaseLineInput['allocations']) => void }) {
  const [rows, setRows] = useState(() => line.allocations.length ? line.allocations : [{ opportunity: fallback, quantity: line.quantity }])
  const difference = line.quantity - rows.reduce((sum, row) => sum + (Number.isFinite(row.quantity) ? row.quantity : 0), 0)
  const columns: ColumnDef<{ opportunity: string; quantity: number; index: number }>[] = [
    { header: 'Affaires', size: 520, minSize: 220, cell: ({ row }) => <div className="purchase-affairs purchase-affairs--picker"><ChartBar size={13} aria-hidden="true" /><HCombobox showCodes={false} label={`Opportunité de ventilation ${row.original.index + 1}`} value={row.original.opportunity} options={choices.opportunities.map((item) => ({ value: item.id, label: item.allocation_label || item.name }))} disabled={!editable} onChange={(opportunity) => setRows(rows.map((item, i) => i === row.original.index ? { ...item, opportunity } : item))} /></div> },
    { header: 'Quantité', size: 110, minSize: 90, cell: ({ row }) => <HInput type="number" step="any" min="0.000001" max={line.quantity} aria-label={`Quantité ventilée ${row.original.index + 1}`} value={row.original.quantity} disabled={!editable} onChange={(e) => setRows(rows.map((item, i) => i === row.original.index ? { ...item, quantity: e.target.valueAsNumber } : item))} /> },
    { header: 'Actions', size: 64, minSize: 60, enableResizing: false, cell: ({ row }) => <HButton variant="ghost" size="icon" aria-label={`Retirer ventilation ${row.original.index + 1}`} disabled={!editable} onClick={() => setRows(rows.filter((_, i) => i !== row.original.index))}><Trash2 size={14} /></HButton> },
  ]
  return <HDialog open className="purchase-allocation-dialog" title="Ventilation analytique" description={`${line.description || 'Nouvelle ligne'} · ${line.quantity} ${line.unit}`} onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form">
    <HDataTable resizable columnBorders columnAlignments={{ Quantité: 'center', Actions: 'center' }} data={rows.map((row, index) => ({ ...row, index }))} columns={columns} />
    {editable && <HButton size="small" onClick={() => setRows([...rows, { opportunity: '', quantity: Math.max(0, difference) }])}><Plus size={14} />Ajouter une affaire</HButton>}<p className="contact-muted">Quantité restante à ventiler : {Number(difference.toFixed(6))} {line.unit}</p>
    <HDialogFooter>{editable && <HButton variant="primary" disabled={Math.abs(difference) > 0.000001 || rows.some((item) => !item.opportunity || !(item.quantity > 0)) || new Set(rows.map((item) => item.opportunity)).size !== rows.length} onClick={() => { onSave(rows); onClose() }}><ChartBar size={14} />Appliquer</HButton>}</HDialogFooter>
  </div></HDialog>
}
