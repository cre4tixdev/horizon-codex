import { useDeferredValue, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Plus, Search, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRecordWorkspace } from '../records/recordContext'
import { HDataTable } from '../ui/HDataTable'
import { HInput } from '../ui/HInput'
import { HDialog } from '../ui/HDialog'
import { HButton } from '../ui/HButton'
import { HLoadingIndicator } from '../ui/HLoadingIndicator'
import { catalogService } from '../../modules/inventory/services/CatalogService'
import { useCatalogAccess } from '../../modules/inventory/hooks/useCatalogAccess'
import type { Product } from '../../modules/inventory/schemas/catalog'
import { formatUnitAmount as formatAmount } from '../formatters/money'
export function ProductPicker({ usage, actionLabel, onChoose, onClose }: { initialProduct: string; usage: 'sale' | 'purchase'; actionLabel: string; onChoose: (id: string) => Promise<void | false>; onClose: () => void }) {
  const access = useCatalogAccess(), client = useQueryClient(), openRecord = useRecordWorkspace(), input = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState(''), [page, setPage] = useState(1), [workspaceError, setWorkspaceError] = useState('')
  const deferredSearch = useDeferredValue(search)
  const query = useQuery({ queryKey: ['inventory', 'products', 'picker', usage, deferredSearch, page], queryFn: () => catalogService.list({ q: deferredSearch, state: 'active', [usage === 'sale' ? 'sale_enabled' : 'purchase_enabled']: 'true', page }), enabled: access.canRead, retry: false })
  const choices = useQuery({ queryKey: ['inventory', 'choices'], queryFn: () => catalogService.choices(), enabled: access.canRead && access.canReadContacts, retry: false })
  const add = useMutation({ mutationFn: onChoose, onSuccess: (added) => { if (added !== false) onClose() } })
  async function launch(id?: string) {
    if (!openRecord) return
    setWorkspaceError('')
    try {
      const result = await openRecord({ resource: 'product', ...(id ? { id } : {}), initial: { search }, returnFocus: () => input.current?.focus() })
      if (result) { await client.invalidateQueries({ queryKey: ['inventory'] }); if (!id) { const created = await catalogService.record(result.id); setSearch(created.sku); setPage(1) } }
    } catch (error) { console.error('[product-picker] Reload failed'); setWorkspaceError(error instanceof Error ? error.message : 'La fiche produit n’a pas pu être rechargée.') }
  }
  const columns: ColumnDef<Product>[] = [
    { header: 'Marque', size: 110, cell: ({ row }) => <span className="quote-product-brand"><Package size={13} />{row.original.manufacturer || '—'}</span> },
    { header: 'Référence / modèle', size: 140, accessorKey: 'sku' },
    { header: 'Description', size: 280, cell: ({ row }) => <div className="quote-product-description"><strong>{row.original.name}</strong>{row.original.description && row.original.description !== row.original.name && <span>{row.original.description}</span>}</div> },
    { header: 'Fournisseur', size: 150, cell: ({ row }) => choices.data?.suppliers.find((supplier) => supplier.id === row.original.pricing.supplier)?.name || '—' },
    { header: 'Coût HT', size: 105, cell: ({ row }) => <span className="quote-product-price">{formatAmount(row.original.pricing.unit_cost, row.original.sale_currency)}</span> },
    { header: 'PUV HT', size: 105, cell: ({ row }) => <span className="quote-product-price">{row.original.pricing.unit_price === null ? 'À vérifier' : formatAmount(row.original.pricing.unit_price, row.original.sale_currency)}</span> },
    { id: 'actions', header: 'Actions', size: 90, enableResizing: false, cell: ({ row }) => <div className="quote-product-row-actions">{openRecord && <HButton variant="secondary" size="icon" disabled={add.isPending} title="Consulter ou modifier le produit" aria-label={`Ouvrir la fiche : ${row.original.name}`} onClick={() => void launch(row.original.id)}><ArrowUpRight size={14} /></HButton>}<HButton variant="primary" size="icon" className="quote-product-add" disabled={add.isPending} title={`Ajouter ${actionLabel}`} aria-label={`Ajouter ${row.original.name} ${actionLabel}`} onClick={() => add.mutate(row.original.id)}><Plus size={14} strokeWidth={2.25} /></HButton></div> },
  ]
  const busy = query.isFetching || deferredSearch !== search
  return <HDialog open title="Ajouter un produit" description="Recherchez par marque, référence ou description, puis ajoutez le produit avec le bouton +." className="quote-product-picker" onOpenChange={(open) => { if (!open && !add.isPending) onClose() }}>
    <div className="dialog-form">
      <div className="quote-product-search"><Search size={16} /><HInput ref={input} autoFocus type="search" aria-label="Rechercher un produit" placeholder="Marque, référence / modèle, description…" maxLength={200} value={search} disabled={add.isPending} onChange={(event) => { setSearch(event.target.value); setPage(1); add.reset() }} />{access.canWrite && openRecord && <HButton disabled={add.isPending} onClick={() => void launch()}><Plus size={14} />Créer un produit</HButton>}</div>
      <div className="quote-product-results" aria-busy={busy}>
        {query.data && <HDataTable resizable columnBorders data={query.data.items} columns={columns} />}
        {query.isPending && <HLoadingIndicator label="Recherche des produits" />}
        {query.data && !query.data.items.length && <p className="quote-product-empty">Aucun produit trouvé. Essayez une autre référence ou créez le produit.</p>}
      </div>
      {query.data && <div className="quote-product-pagination"><span>{query.data.totalItems} produit{query.data.totalItems > 1 ? 's' : ''}</span><nav aria-label="Résultats produits"><HButton variant="ghost" size="icon" aria-label="Produits précédents" disabled={page <= 1 || busy || add.isPending} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><span>{page} / {Math.max(1, query.data.totalPages)}</span><HButton variant="ghost" size="icon" aria-label="Produits suivants" disabled={page >= query.data.totalPages || busy || add.isPending} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></nav></div>}
      {(query.error || choices.error || add.error || workspaceError) && <p role="alert" className="field-error">{query.error?.message || choices.error?.message || add.error?.message || workspaceError}</p>}
    </div>
  </HDialog>
}
