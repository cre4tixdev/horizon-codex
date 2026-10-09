import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, Check } from 'lucide-react'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { catalogService, useCatalogAccess } from '../../inventory'
import type { QuoteLineInput } from '../schemas/quotes'
import { formatUnitAmount as formatAmount } from '../../../shared/formatters/money'
export function QuoteProductPicker({ initial, currency, onChoose, onClose }: { initial: { product: string; product_supplier: string }; currency: string; onChoose: (line: Partial<QuoteLineInput>) => void; onClose: () => void }) {
  const access = useCatalogAccess(), client = useQueryClient(), [search, setSearch] = useState(''), [selected, setSelected] = useState(initial.product)
  const query = useQuery({ queryKey: ['inventory', 'products', 'picker', search], queryFn: () => catalogService.list({ q: search, state: 'active', page: 1 }), enabled: access.canRead, retry: false })
  const record = useQuery({ queryKey: ['inventory', 'product', selected], queryFn: () => catalogService.record(selected), enabled: access.canRead && Boolean(selected), retry: false })
  const add = useMutation({ mutationFn: () => catalogService.quoteLine(selected, '', currency), onSuccess: (value) => { onChoose({ ...value, price_source: 'manual' }); onClose() } })
  const options = (query.data?.items || []).filter((item) => item.sale_enabled).map((item) => ({ value: item.id, label: [item.manufacturer, item.sku, item.name].filter(Boolean).join(' · ') }))
  if (record.data && !options.some((item) => item.value === record.data.id)) options.push({ value: record.data.id, label: [record.data.manufacturer, record.data.sku, record.data.name].filter(Boolean).join(' · ') })
  return <HDialog open title="Choisir un produit" description="Le coût et le prix de vente sont proposés depuis le catalogue. Vous pouvez les ajuster dans le devis." onOpenChange={(open) => { if (!open && !add.isPending) onClose() }}><div className="dialog-form"><label className="h-form-field"><HFieldLabel required>Produit</HFieldLabel><HRecordPicker label="Produit" resource="product" createLabel="Créer un produit" canCreate={access.canWrite} canInspect={access.canRead} ready value={selected} options={options} showCodes={false} required disabled={add.isPending} onChange={(value) => { setSelected(value); add.reset() }} onSearchChange={setSearch} onSaved={async () => { await client.invalidateQueries({ queryKey: ['inventory'] }) }} /></label>{selected && record.isPending && <HLoadingIndicator label="Chargement du tarif" />}{record.data && <><p className="contact-muted">Coût : {formatAmount(record.data.pricing.unit_cost, record.data.sale_currency)} · PUV : {record.data.pricing.unit_price === null ? 'À vérifier' : formatAmount(record.data.pricing.unit_price, record.data.sale_currency)}</p><p className="contact-muted">Famille {record.data.category_label} · coefficient {record.data.pricing.coefficient.toLocaleString('fr-FR')} · devise {record.data.sale_currency}</p></>}{(query.error || record.error || add.error) && <p role="alert" className="field-error">{query.error?.message || record.error?.message || add.error?.message}</p>}</div><HDialogFooter><HButton variant="primary" size="small" disabled={!record.data || add.isPending || record.isFetching} onClick={() => add.mutate()}><Check size={14} />Appliquer au devis</HButton></HDialogFooter></HDialog>
}
export function AddProductButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) { const access = useCatalogAccess(); return access.canRead ? <HButton variant="ghost" size="small" disabled={disabled} onClick={onClick}><Package size={13} /><Plus size={12} />Ajouter un produit</HButton> : null }
