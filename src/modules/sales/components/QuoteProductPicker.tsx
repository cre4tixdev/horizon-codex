import { useDeferredValue, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Plus, Check, Search, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HInput } from '../../../shared/ui/HInput'
import { HDialog } from '../../../shared/ui/HDialog'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { catalogService, useCatalogAccess, type Product } from '../../inventory'
import type { QuoteLineInput } from '../schemas/quotes'
import { formatUnitAmount as formatAmount } from '../../../shared/formatters/money'
export function QuoteProductPicker({ initial, currency, onChoose, onClose }: { initial: { product: string; product_supplier: string }; currency: string; onChoose: (line: Partial<QuoteLineInput>) => void; onClose: () => void }) {
  const access = useCatalogAccess(), client = useQueryClient(), openRecord = useRecordWorkspace(), input = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState(''), [selected, setSelected] = useState(initial.product), [page, setPage] = useState(1), [workspaceError, setWorkspaceError] = useState('')
  const deferredSearch = useDeferredValue(search)
  const query = useQuery({ queryKey: ['inventory', 'products', 'picker', deferredSearch, page], queryFn: () => catalogService.list({ q: deferredSearch, state: 'active', sale_enabled: 'true', page }), enabled: access.canRead, retry: false })
  const add = useMutation({ mutationFn: (product: string) => catalogService.quoteLine(product, '', currency), onSuccess: (value) => { onChoose({ ...value, price_source: 'manual' }); onClose() } })
  async function launch(id?: string) {
    if (!openRecord) return
    setWorkspaceError('')
    try {
      const result = await openRecord({ resource: 'product', ...(id ? { id } : {}), initial: { search }, returnFocus: () => input.current?.focus() })
      if (result) { await client.invalidateQueries({ queryKey: ['inventory'] }); if (!id) { const created = await catalogService.record(result.id); setSearch(created.sku); setPage(1); setSelected(result.id) } }
    } catch (error) { console.error('[quote-product-picker] Reload failed'); setWorkspaceError(error instanceof Error ? error.message : 'La fiche produit n’a pas pu être rechargée.') }
  }
  const columns: ColumnDef<Product>[] = [
    { header: 'Marque', size: 130, cell: ({ row }) => <span className="quote-product-brand">{row.original.id === selected ? <Check size={13} /> : <Package size={13} />}{row.original.manufacturer || '—'}</span> },
    { header: 'Référence / modèle', size: 160, accessorKey: 'sku' },
    { header: 'Description', size: 340, cell: ({ row }) => <div className="quote-product-description"><strong>{row.original.name}</strong>{row.original.description && row.original.description !== row.original.name && <span>{row.original.description}</span>}</div> },
    { header: 'Coût HT', size: 105, cell: ({ row }) => <span className="quote-product-price">{formatAmount(row.original.pricing.unit_cost, row.original.sale_currency)}</span> },
    { header: 'PUV HT', size: 105, cell: ({ row }) => <span className="quote-product-price">{row.original.pricing.unit_price === null ? 'À vérifier' : formatAmount(row.original.pricing.unit_price, row.original.sale_currency)}</span> },
    { id: 'actions', header: 'Actions', size: 90, enableResizing: false, cell: ({ row }) => <div className="quote-product-row-actions">{openRecord && <HButton variant="secondary" size="icon" disabled={add.isPending} title="Consulter ou modifier le produit" aria-label={`Ouvrir la fiche : ${row.original.name}`} onClick={() => void launch(row.original.id)}><ArrowUpRight size={14} /></HButton>}<HButton variant="primary" size="icon" className="quote-product-add" disabled={add.isPending} title="Ajouter au devis" aria-label={`Ajouter ${row.original.name} au devis`} onClick={() => add.mutate(row.original.id)}><Plus size={14} strokeWidth={2.25} /></HButton></div> },
  ]
  const busy = query.isFetching || deferredSearch !== search
  return <HDialog open title="Ajouter un produit" description="Recherchez par marque, référence ou description, puis ajoutez le produit avec le bouton +." className="quote-product-picker" onOpenChange={(open) => { if (!open && !add.isPending) onClose() }}>
    <div className="dialog-form">
      <div className="quote-product-search"><Search size={16} /><HInput ref={input} autoFocus type="search" aria-label="Rechercher un produit" placeholder="Marque, référence / modèle, description…" maxLength={200} value={search} disabled={add.isPending} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelected(''); add.reset() }} />{access.canWrite && openRecord && <HButton disabled={add.isPending} onClick={() => void launch()}><Plus size={14} />Créer un produit</HButton>}</div>
      <div className="quote-product-results" aria-busy={busy}>
        {query.data && <HDataTable resizable columnBorders data={query.data.items.filter((item) => item.sale_enabled)} columns={columns} getRowAction={(item) => ({ label: `Sélectionner ${[item.manufacturer, item.sku, item.name].filter(Boolean).join(' · ')}`, onClick: () => { if (!add.isPending) { setSelected(item.id); add.reset() } } })} />}
        {query.isPending && <HLoadingIndicator label="Recherche des produits" />}
        {query.data && !query.data.items.length && <p className="quote-product-empty">Aucun produit trouvé. Essayez une autre référence ou créez le produit.</p>}
      </div>
      {query.data && <div className="quote-product-pagination"><span>{query.data.totalItems} produit{query.data.totalItems > 1 ? 's' : ''}</span><nav aria-label="Résultats produits"><HButton variant="ghost" size="icon" aria-label="Produits précédents" disabled={page <= 1 || busy || add.isPending} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><span>{page} / {Math.max(1, query.data.totalPages)}</span><HButton variant="ghost" size="icon" aria-label="Produits suivants" disabled={page >= query.data.totalPages || busy || add.isPending} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></nav></div>}
      {(query.error || add.error || workspaceError) && <p role="alert" className="field-error">{query.error?.message || add.error?.message || workspaceError}</p>}
    </div>
  </HDialog>
}
export function AddProductButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) { const access = useCatalogAccess(); return access.canRead ? <HButton variant="ghost" size="small" disabled={disabled} onClick={onClick}><Package size={13} /><Plus size={12} />Ajouter un produit</HButton> : null }
