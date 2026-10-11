import { HAffairTags } from '../../../shared/ui/HAffairTags'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ShoppingCart } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { formatAmount } from '../../../shared/formatters/money'
import { purchasingService } from '../services/PurchasingService'
import type { Purchase, PurchaseChoices, OrderSelection } from '../schemas/purchasing'
export function PrepareOrders({ requests, choices, onClose }: { requests: Purchase[]; choices: PurchaseChoices; onClose: () => void }) {
  const navigate = useNavigate(), client = useQueryClient(), [key] = useState(() => crypto.randomUUID())
  const rows = requests.flatMap((request) => request.lines.filter((line) => line.quantity > line.prepared_quantity).map((line) => ({ ...line, number: request.number, currency: request.currency, remaining: line.quantity - line.prepared_quantity })))
  const [selected, setSelected] = useState<Record<string, OrderSelection>>({})
  const generate = useMutation({ mutationFn: () => purchasingService.generate(Object.values(selected), key), onSuccess: async (orders) => { await client.invalidateQueries({ queryKey: ['purchasing'] }); onClose(); navigate(orders.length === 1 ? `/purchasing/orders/${orders[0]!.id}` : '/purchasing/orders') } })
  function choose(id: string, patch: Partial<OrderSelection>) { setSelected((current) => ({ ...current, [id]: { ...current[id]!, ...patch } })) }
  return <HDialog open title="Préparer les commandes fournisseur" description="Les lignes choisies seront regroupées par fournisseur et devise dans des commandes brouillon. Les codes analytiques seront conservés." className="purchasing-prepare-dialog" onOpenChange={(open) => { if (!open && !generate.isPending) onClose() }}>
    <HDataTable columnBorders data={rows} columns={[
      { id: 'selected', header: '', size: 36, cell: ({ row }) => <input type="checkbox" aria-label={`Commander ${row.original.description}`} checked={Boolean(selected[row.original.id])} disabled={generate.isPending} onChange={(e) => setSelected((current) => { const next = { ...current }; if (e.target.checked) next[row.original.id] = { id: row.original.id, supplier: row.original.supplier, quantity: row.original.remaining }; else delete next[row.original.id]; return next })} /> },
      { header: 'Demande', accessorKey: 'number' }, { header: 'Description', accessorKey: 'description' }, { header: 'Affaires', cell: ({ row }) => <HAffairTags items={row.original.allocations} /> },
      { header: 'Fournisseur', cell: ({ row }) => <HCombobox showCodes={false} label={`Fournisseur de ${row.original.description}`} value={selected[row.original.id]?.supplier || row.original.supplier} options={choices.suppliers.map((item) => ({ value: item.id, label: item.name }))} disabled={!selected[row.original.id] || generate.isPending} onChange={(supplier) => choose(row.original.id, { supplier })} /> },
      { header: 'Qté', cell: ({ row }) => <HInput type="number" min="0.000001" step="any" max={row.original.remaining} aria-label={`Quantité à commander de ${row.original.description}`} value={selected[row.original.id]?.quantity ?? row.original.remaining} disabled={!selected[row.original.id] || generate.isPending} onChange={(e) => choose(row.original.id, { quantity: e.target.valueAsNumber })} /> },
      { header: 'PUA HT', cell: ({ row }) => formatAmount(row.original.unit_price, row.original.currency) },
    ]} />
    {!rows.length && <p className="contact-muted">Toutes les quantités sont déjà préparées ou commandées.</p>}{generate.error && <p className="field-error" role="alert">{generate.error.message}</p>}
    <HDialogFooter><HButton variant="primary" disabled={!Object.values(selected).length || generate.isPending || Object.values(selected).some((line) => !line.supplier || !(line.quantity > 0))} onClick={() => generate.mutate()}><ShoppingCart size={14} />Préparer les commandes</HButton></HDialogFooter>
  </HDialog>
}
