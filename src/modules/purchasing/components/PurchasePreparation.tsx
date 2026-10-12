import { createContext, useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { Check, ShoppingCart } from 'lucide-react'
import type { StockSelection } from '../../inventory/schemas/stock'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HNumberInput } from '../../../shared/ui/HNumberInput'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { formatAmount } from '../../../shared/formatters/money'
import { purchasingService } from '../services/PurchasingService'
import type { PurchasePreparationSelection } from '../schemas/purchasing'

type Row = PurchasePreparationSelection & { description: string; brand: string; reference: string; remaining: number; reserved: number; unit: string; unit_price: number }
type Editor = { busy: boolean; currency: string; suppliers: { id: string; name: string }[]; selected: Record<string, PurchasePreparationSelection>; change: (row: Row, value?: Partial<PurchasePreparationSelection>) => void }
const EditorContext = createContext<Editor | undefined>(undefined)
function SelectCell({ row }: CellContext<Row, unknown>) {
  const editor = useContext(EditorContext)!
  return <input type="checkbox" aria-label={`Acheter ${row.original.description}`} checked={Boolean(editor.selected[row.original.source_line])} disabled={editor.busy || row.original.remaining <= 0} onChange={() => editor.change(row.original)} />
}
function QuantityCell({ row }: CellContext<Row, unknown>) {
  const editor = useContext(EditorContext)!, selected = editor.selected[row.original.source_line]
  return <HNumberInput aria-label={`Quantité à acheter ${row.original.description}`} min={0.000001} max={row.original.remaining} step="any" disabled={editor.busy || !selected} value={selected ? Math.min(selected.quantity, row.original.remaining) : 0} onChange={(quantity) => editor.change(row.original, { quantity })} />
}
function SupplierCell({ row }: CellContext<Row, unknown>) {
  const editor = useContext(EditorContext)!, selected = editor.selected[row.original.source_line]
  return <HCombobox label={`Fournisseur à proposer ${row.original.description}`} showCodes={false} value={selected?.supplier || ''} options={editor.suppliers.map((item) => ({ value: item.id, label: item.name }))} disabled={editor.busy || !selected} onChange={(supplier) => editor.change(row.original, { supplier })} />
}
function PriceCell({ row }: CellContext<Row, unknown>) { const editor = useContext(EditorContext)!; return formatAmount(row.original.unit_price, editor.currency) }
const columns: ColumnDef<Row>[] = [
  { id: 'selected', header: '', size: 36, cell: SelectCell },
  { header: 'Produit / ligne', accessorKey: 'description', size: 220 },
  { header: 'Marque', accessorKey: 'brand', size: 90 },
  { header: 'Référence', accessorKey: 'reference', size: 110 },
  { header: 'Réservé', size: 75, cell: ({ row }) => `${row.original.reserved} ${row.original.unit}` },
  { header: 'À acheter', size: 90, cell: QuantityCell },
  { header: 'Fournisseur', size: 170, cell: SupplierCell },
  { header: 'PUA HT', size: 95, cell: PriceCell },
]
export function PurchasePreparation({ quote, reservations, busy, ready, onChange, onApply }: { quote: string; reservations: StockSelection[]; busy: boolean; ready: boolean; onChange: () => void; onApply: (lines: PurchasePreparationSelection[]) => void }) {
  const needs = useQuery({ queryKey: ['purchasing', 'confirmation-needs', quote], queryFn: () => purchasingService.needs(quote, true), retry: false })
  const choices = useQuery({ queryKey: ['purchasing', 'choices'], queryFn: () => purchasingService.choices(), retry: false })
  const [selected, setSelected] = useState<Record<string, PurchasePreparationSelection>>({})
  if (needs.error || choices.error) return <p role="alert" className="field-error">{needs.error?.message || choices.error?.message}<HButton onClick={() => { void needs.refetch(); void choices.refetch() }}>Réessayer</HButton></p>
  if (!needs.data || !choices.data) return <HLoadingIndicator label="Préparation des besoins d’achat" />
  const rows: Row[] = needs.data.lines.map((line) => {
    const reserved = reservations.filter((item) => item.source_line === line.source_line).reduce((total, item) => total + item.quantity, 0)
    return { ...line, reserved, remaining: Math.max(0, line.quantity - reserved) }
  })
  const lines = rows.filter((row) => selected[row.source_line] && row.remaining > 0).map((row) => ({ ...selected[row.source_line]!, quantity: Math.min(selected[row.source_line]!.quantity, row.remaining) }))
  const valid = rows.every((row) => !selected[row.source_line] || row.remaining <= 0 || Number.isFinite(selected[row.source_line]!.quantity) && selected[row.source_line]!.quantity > 0)
  function change(row: Row, value?: Partial<PurchasePreparationSelection>) {
    onChange()
    setSelected((current) => {
      const next = { ...current }
      if (value) next[row.source_line] = { ...next[row.source_line]!, ...value }
      else if (next[row.source_line]) delete next[row.source_line]
      else next[row.source_line] = { source_line: row.source_line, quantity: row.remaining, supplier: row.supplier }
      return next
    })
  }
  return <section className="quote-inline-preparation">
    <HSectionHeading icon={ShoppingCart} title="Préparation des achats" description="Choisissez les besoins à préparer. Le stock réservé est déduit ; la confirmation créera une demande d’achat en brouillon." />
    <EditorContext value={{ busy, currency: needs.data.currency, suppliers: choices.data.suppliers, selected, change }}><HDataTable columnBorders resizable columnAlignments={{ selected: 'center', 'À acheter': 'center', Réservé: 'center', 'PUA HT': 'right' }} data={rows} columns={columns} /></EditorContext>
    <div className="quote-inline-preparation-actions"><HButton disabled={busy || !valid || !lines.length && rows.some((row) => row.remaining > 0)} onClick={() => onApply(lines)}><Check size={14} />{ready ? 'Préparation prête' : 'Appliquer la préparation'}</HButton></div>
  </section>
}
