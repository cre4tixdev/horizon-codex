import { useEffect, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { ProductPicker } from '../../../shared/catalog/ProductPicker'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HNumberInput } from '../../../shared/ui/HNumberInput'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { formatUnitAmount } from '../../../shared/formatters/money'
import { catalogService } from '../services/CatalogService'
import type { ProductInput } from '../schemas/catalog'
export function ProductKitComposition({ items, parent, currency, disabled, onChange, onCost }: { items: ProductInput['components']; parent: string | undefined; currency: string; disabled: boolean; onChange: (items: ProductInput['components']) => void; onCost: (value: { cost: number; warning: string }) => void }) {
  const [adding, setAdding] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const openRecord = useRecordWorkspace(), client = useQueryClient()
  async function openComponent(id: string, trigger: HTMLButtonElement) {
    if (!openRecord) return
    setWorkspaceError('')
    try {
      const result = await openRecord({ resource: 'product', id, returnFocus: () => trigger.focus() })
      if (result) await client.invalidateQueries({ queryKey: ['inventory'] })
    } catch (error) {
      console.error('[kit-composition] Component reload failed')
      setWorkspaceError(error instanceof Error ? error.message : 'La fiche du composant n’a pas pu être rechargée.')
    }
  }
  const products = useQueries({ queries: items.map((item) => ({ queryKey: ['inventory', 'product', item.product], queryFn: () => catalogService.record(item.product), retry: false })) })
  const cost = items.reduce((sum, item, index) => sum + item.quantity * (products[index]?.data?.pricing.unit_cost || 0), 0)
  const warning = products.some((query) => query.isPending) ? 'Chargement des coûts…' : products.find((query) => query.error)?.error?.message || products.map((query) => query.data).find((product) => product && (!product.active || product.sale_currency !== currency || product.pricing.warning))?.pricing.warning || (products.some((query) => query.data && (!query.data.active || query.data.sale_currency !== currency)) ? 'Un composant est archivé ou dans une autre devise.' : '')
  useEffect(() => onCost({ cost, warning }), [cost, warning, onCost])
  return <><HSectionHeading title="Composition du kit" count={items.length} description="Quantités pour un kit. Le coût est calculé à partir des composants ; le stock et les achats portent sur chacun d’eux." />
    <div className="catalog-kit-composition"><HDataTable data={items} columnBorders columnWidths={{ position: 64, brand: 120, reference: 160, quantity: 100, unit: 60, cost: 140, total: 140, actions: 64 }} columnAlignments={{ position: 'center', quantity: 'right', unit: 'center', cost: 'right', total: 'right', actions: 'center' }} {...(!disabled ? { reordering: { getRowId: (item: ProductInput['components'][number]) => item.product, getRowLabel: (item: ProductInput['components'][number]) => products[items.indexOf(item)]?.data?.name || 'Composant', onMove: (from: number, to: number) => { const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]!); onChange(next) } } } : {})} columns={[
      { id: 'position', header: '#', cell: ({ row }) => row.index + 1 },
      { id: 'product', header: 'Produit', cell: ({ row }) => <div className="h-input-with-action quote-description-input-action"><span className="quote-product-text" title={products[row.index]?.data?.name}>{products[row.index]?.data?.name || 'Chargement…'}</span>{openRecord && <HButton variant="ghost" size="icon" title="Consulter ou modifier le composant" aria-label={`Ouvrir la fiche du composant ${row.index + 1}`} onClick={(event) => void openComponent(row.original.product, event.currentTarget)}><ArrowUpRight size={14} /></HButton>}</div> },
      { id: 'brand', header: 'Marque', cell: ({ row }) => products[row.index]?.data?.manufacturer || '—' },
      { id: 'reference', header: 'Référence', cell: ({ row }) => products[row.index]?.data?.sku || '—' },
      { id: 'quantity', header: 'Qté / kit', cell: ({ row }) => <HNumberInput aria-label={`Quantité du composant ${row.index + 1}`} min={0.000001} max={1000000} step="any" disabled={disabled} value={row.original.quantity} onChange={(quantity) => onChange(items.map((item, index) => index === row.index ? { ...item, quantity } : item))} /> },
      { id: 'unit', header: 'Unité', cell: ({ row }) => products[row.index]?.data?.unit_code || '—' },
      { id: 'cost', header: 'Coût HT / unité', cell: ({ row }) => products[row.index]?.data ? formatUnitAmount(products[row.index]!.data!.pricing.unit_cost, currency) : '—' },
      { id: 'total', header: 'Coût HT / kit', cell: ({ row }) => products[row.index]?.data ? formatUnitAmount(products[row.index]!.data!.pricing.unit_cost * row.original.quantity, currency) : '—' },
      { id: 'actions', header: 'Actions', cell: ({ row }) => <div className="catalog-cell-actions">{!disabled && <HButton variant="ghost" size="icon" aria-label={`Retirer le composant ${row.index + 1}`} onClick={() => onChange(items.filter((_, index) => index !== row.index))}><Trash2 size={14} /></HButton>}</div> },
    ]} /></div>
    {workspaceError && <p role="alert" className="field-error">{workspaceError}</p>}
    {!items.length && <p className="contact-muted">Ajoutez les produits et services qui composent ce kit.</p>}
    {!disabled && <div className="quote-line-toolbar"><HButton variant="ghost" size="small" disabled={items.length >= 50} onClick={() => setAdding(true)}><Plus size={14} />Ajouter un composant</HButton></div>}
    <div className="sales-quote-totals"><span>Coût total d’un kit</span><strong>{warning ? 'À vérifier' : formatUnitAmount(cost, currency)}</strong></div>{warning && <p role="alert" className="field-error">{warning}</p>}
    {adding && <ProductPicker initialProduct="" usage="sale" actionLabel="au kit" onClose={() => setAdding(false)} onChoose={async (id) => { const product = await catalogService.record(id); if (id === parent || product.composition_mode === 'kit') throw new Error('Choisissez un produit simple : auto-référence et kits imbriqués sont interdits.'); if (items.some((item) => item.product === id)) throw new Error('Ce composant est déjà présent. Modifiez sa quantité.'); if (product.sale_currency !== currency) throw new Error('La devise du composant doit correspondre à celle du kit.'); onChange([...items, { product: id, quantity: 1 }]) }} />}
  </>
}
