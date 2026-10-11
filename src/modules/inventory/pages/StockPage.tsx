import { formatAmount } from '../../../shared/formatters/money'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { PackageCheck, LockKeyhole, Boxes, Package, SlidersHorizontal, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { stockService } from '../services/StockService'
import { useStockAccess } from '../hooks/useStockAccess'
import type { StockRow } from '../schemas/stock'
export function StockPage() {
  const access = useStockAccess(), [params, setParams] = useSearchParams(), [adjusting, setAdjusting] = useState<StockRow>(), [place, setPlace] = useState(false), client = useQueryClient()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useQuery({ queryKey: ['inventory', 'stock', params.toString()], queryFn: () => stockService.list({ availability: params.get('availability') || '', q: params.get('q') || '', product: params.get('product') || '', location: params.get('location') || '', sort: params.get('sort') || 'name', group: params.get('group') || '', page }), enabled: access.canRead, retry: false })
  const columns: ColumnDef<StockRow>[] = [{ header: 'Produit', cell: ({ row }) => <Link to={`/inventory/products/${row.original.product}`}>{row.original.name}</Link> }, { header: 'Marque', accessorKey: 'brand' }, { header: 'Référence', accessorKey: 'reference' }, { header: 'Emplacement', accessorKey: 'location_name' }, { header: 'Physique', accessorKey: 'physical' }, { header: 'Réservé', accessorKey: 'reserved' }, { header: 'Disponible', accessorKey: 'available' }, { header: 'Entrant (produit)', cell: ({ row }) => row.original.incoming === null ? '—' : row.original.incoming }, { header: 'u.', accessorKey: 'unit' }, { header: 'Valeur HT', cell: ({ row }) => row.original.valuation === null || row.original.valuation === undefined ? 'À reprendre' : formatAmount(row.original.valuation, row.original.valuation_currency || 'EUR') }, { header: 'Actions', cell: ({ row }) => access.canAdjust && <HButton variant="ghost" size="icon" title="Ajuster le stock" aria-label={`Ajuster le stock de ${row.original.name}`} onClick={() => setAdjusting(row.original)}><SlidersHorizontal size={14} /></HButton> }]
  const table = (items: StockRow[]) => <HDataTable columnBorders data={items} columns={columns} />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Stock', href: '/inventory/dashboard' }, { label: 'Disponibilités' }]} /><HPageHeader title="Disponibilités" description="Stock réel par emplacement : physique, réservé et disponible. Les achats non réceptionnés n’augmentent jamais le stock." actions={access.canConfigure && <HButton onClick={() => setPlace(true)}><MapPin size={14} />Nouvel emplacement</HButton>} />
    <HBreadcrumbActions><nav className="record-navigator"><span>Page {page} / {query.data?.totalPages || 1}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1} onClick={() => setParams((p) => { p.set('page', String(page - 1)); return p })}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={!query.data || page >= query.data.totalPages} onClick={() => setParams((p) => { p.set('page', String(page + 1)); return p })}><ChevronRight size={14} /></HButton></nav></HBreadcrumbActions>
    {access.canRead && <HSummaryCards label="Synthèse du stock" items={([
      { key: 'all', label: 'Produits stockables', icon: Boxes, tone: 'blue' },
      { key: 'physical', label: 'En stock', icon: Package, tone: 'blue' },
      { key: 'reserved', label: 'Réservés', icon: LockKeyhole, tone: 'violet' },
      { key: 'available', label: 'Disponibles', icon: PackageCheck, tone: 'green' },
    ] as const).map(({ key, label, icon, tone }) => {
      const next = new URLSearchParams(params); next.delete('page'); if (key === 'all') next.delete('availability'); else next.set('availability', key)
      return { label, icon, tone, count: query.data?.summary[key], detail: 'Produits distincts', accessibleLabel: `Filtrer le stock : ${label}`, href: `/inventory/stock?${next}` }
    })} error={undefined} onRetry={() => { void query.refetch() }} />}
    {!access.canRead ? <p className="contact-muted">Accès au stock nécessaire.</p> : query.isPending ? <HLoadingIndicator label="Chargement du stock" /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : query.data && <>{params.get('group') === 'location' ? <GroupedResults icon={Package} noun="produits" groups={groupResults(query.data.items, (item) => ({ key: item.location, label: item.location_name }))} render={table} /> : table(query.data.items)}<p className="contact-muted">{query.data.totalItems} produit(s) · Les corrections de quantité créent un mouvement audité.</p></>}
    {adjusting && <Adjustment row={adjusting} onClose={() => setAdjusting(undefined)} onSaved={async () => { await client.invalidateQueries({ queryKey: ['inventory'] }); setAdjusting(undefined) }} />}{place && <NewLocation onClose={() => setPlace(false)} />}
  </div>
}
function Adjustment({ row, onClose, onSaved }: { row: StockRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [physical, setPhysical] = useState(row.physical), [reason, setReason] = useState(''), [key] = useState(() => crypto.randomUUID())
  const save = useMutation({ mutationFn: () => stockService.adjust({ product: row.product, location: row.location, physical, expected: row.physical, reason, operation_key: key }), onSuccess: onSaved })
  return <HDialog open title="Ajuster le stock" description={`${row.name} · ${row.location_name}`} onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><form className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><p className="contact-muted">Physique actuel : {row.physical} {row.unit} · Réservé : {row.reserved} {row.unit}</p><label><HFieldLabel required>Quantité physique constatée</HFieldLabel><HInput autoFocus required type="number" min={row.reserved} step="any" value={physical} onChange={(e) => setPhysical(e.target.valueAsNumber)} /></label><label><HFieldLabel required>Justification</HFieldLabel><HInput required maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Inventaire initial, correction de comptage…" /></label>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<HDialogFooter><HButton type="submit" variant="primary" disabled={save.isPending || physical === row.physical}><SlidersHorizontal size={14} />Appliquer le mouvement</HButton></HDialogFooter></form></HDialog>
}
function NewLocation({ onClose }: { onClose: () => void }) {
  const client = useQueryClient(), [warehouse, setWarehouse] = useState(''), [name, setName] = useState(''), [code, setCode] = useState('')
  const choices = useQuery({ queryKey: ['inventory', 'stock-choices'], queryFn: () => stockService.choices(), retry: false })
  const save = useMutation({ mutationFn: () => stockService.createLocation(warehouse || choices.data?.warehouses[0]?.id || '', code, name), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['inventory'] }); onClose() } })
  return <HDialog open title="Nouvel emplacement" description="Le nouvel emplacement sera vide ; les entrées de stock passent par des mouvements." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><form className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><label><HFieldLabel required>Entrepôt</HFieldLabel><HCombobox showCodes={false} label="Entrepôt de l’emplacement" value={warehouse || choices.data?.warehouses[0]?.id || ''} options={(choices.data?.warehouses || []).map((item) => ({ value: item.id, label: item.name }))} onChange={setWarehouse} /></label><label><HFieldLabel required>Code</HFieldLabel><HInput required maxLength={40} value={code} onChange={(e) => setCode(e.target.value)} /></label><label><HFieldLabel required>Nom</HFieldLabel><HInput required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>{(save.error || choices.error) && <p role="alert" className="field-error">{save.error?.message || choices.error?.message}</p>}<HDialogFooter><HButton type="submit" variant="primary" disabled={save.isPending || !choices.data}><MapPin size={14} />Créer l’emplacement</HButton></HDialogFooter></form></HDialog>
}
