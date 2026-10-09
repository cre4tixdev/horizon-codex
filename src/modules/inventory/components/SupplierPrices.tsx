import { useState, type ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { Star, Plus, Trash2, CalendarDays } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { HDialog } from '../../../shared/ui/HDialog'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { HRecordConfirmation } from '../../../shared/ui/HRecordConfirmation'
import { formatUnitAmount as formatAmount } from '../../../shared/formatters/money'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
import type { OfferInput, CatalogChoices, Product } from '../schemas/catalog'
type SupplierRow = { cells: ReactNode[] }
const headers: ReactNode[] = [<Star key="favorite" size={13} aria-label="Fournisseur favori" />, 'Fournisseur', 'Réf. fournisseur', 'Devise', 'Prix liste HT', 'Remise %', 'Prix d’achat HT', 'Qté du lot', 'Coût / u.', 'Délai · j', 'Validité', 'Actions']
const widths = [36, 290, 130, 76, 130, 65, 135, 85, 110, 60, 105, 54]
const columns: ColumnDef<SupplierRow>[] = headers.map((header, index) => ({ id: String(index), size: widths[index] ?? 120, minSize: index === 0 ? 32 : index === 1 ? 140 : 50, maxSize: 600, enableResizing: ![0, 11].includes(index), header: typeof header === 'string' ? header : () => header, cell: ({ row }) => row.original.cells[index] }))
export function SupplierPrices({ values, onChange, choices, record, unit, currency, disabled, onReload }: { values: OfferInput[]; onChange: (value: OfferInput[]) => void; choices: CatalogChoices; record?: Product | undefined; unit: string; currency: string; disabled: boolean; onReload: () => Promise<void> }) {
  const access = useCatalogAccess(), [removing, setRemoving] = useState<number>(), [validityIndex, setValidityIndex] = useState<number>()
  const patch = (index: number, changes: Partial<OfferInput>) => onChange(values.map((item, i) => i === index ? { ...item, ...changes } : item))
  const suppliers = [...choices.suppliers, ...(record?.offers || []).filter((offer) => !choices.suppliers.some((item) => item.id === offer.supplier)).map((offer) => ({ id: offer.supplier, name: offer.supplier_name }))].map((item) => ({ value: item.id, label: item.name }))
  return <><p className="contact-muted">Le favori fournit le coût de référence. Quantité du lot en {unit || 'unités de base'}.</p><div className="catalog-suppliers"><HDataTable<SupplierRow> columns={columns} resizable data={values.map((offer, index) => { const net = offer.list_price * (1 - offer.discount / 100); return { cells: [
<HButton size="icon" variant="ghost" className={`catalog-favorite${offer.is_preferred ? ' catalog-favorite--selected' : ''}`} title={offer.is_preferred ? 'Fournisseur favori' : 'Définir comme favori'} aria-label={offer.is_preferred ? 'Retirer le fournisseur favori' : `Définir le fournisseur ${index + 1} comme favori`} aria-pressed={offer.is_preferred} disabled={disabled} onClick={() => onChange(values.map((item, i) => ({ ...item, is_preferred: i === index ? !offer.is_preferred : false })))}><Star size={15} fill={offer.is_preferred ? 'currentColor' : 'none'} /></HButton>,
<div className={offer.is_preferred ? "catalog-preferred-supplier" : undefined}><HRecordPicker resource="company" initial={{ roles: 'supplier' }} createLabel="Créer un fournisseur" canCreate={access.canWriteContacts} canInspect={access.canReadContacts} ready onSaved={onReload} label={`Fournisseur ${index + 1}`} value={offer.supplier} options={suppliers} required showCodes={false} disabled={disabled || !access.canReadContacts} onChange={(supplier) => patch(index, { supplier })} /></div>,
<HInput aria-label={`Référence fournisseur ${index + 1}`} value={offer.supplier_sku} onChange={(e) => patch(index, { supplier_sku: e.target.value })} />,
<HCombobox label={`Devise fournisseur ${index + 1}`} value={offer.currency} options={choices.currencies.map((item) => ({ value: item.code, label: item.code }))} onChange={(value) => patch(index, { currency: value })} required showCodes={false} clearable={false} disabled={disabled} />,
<HAmountInput inlineCurrency unitPrecision currency={offer.currency} aria-label={`Prix liste ${index + 1}`} value={offer.list_price} onChange={(value) => patch(index, { list_price: value })} />,
<HInput type="number" min={0} max={100} step="any" aria-label={`Remise fournisseur ${index + 1}`} value={offer.discount} onChange={(e) => patch(index, { discount: Number(e.target.value) })} />,
<span className="catalog-number">{Number.isFinite(net) ? formatAmount(net, offer.currency) : '—'}</span>,
<HInput type="number" min={0.000001} step="any" aria-label={`Conditionnement ${index + 1}`} value={offer.purchase_quantity} onChange={(e) => patch(index, { purchase_quantity: Number(e.target.value) })} />,
<span className="catalog-number">{offer.purchase_quantity > 0 && Number.isFinite(net) ? formatAmount(net / offer.purchase_quantity, offer.currency) : '—'}</span>,
<HInput type="number" min={0} step={1} aria-label={`Délai fournisseur ${index + 1}`} value={offer.lead_time_days} onChange={(e) => patch(index, { lead_time_days: Number(e.target.value) })} />,
<HButton size="small" variant="ghost" className="catalog-validity" disabled={disabled} title={offer.valid_from || offer.valid_until ? `Du ${offer.valid_from || "—"} au ${offer.valid_until || "—"}` : "Sans limite de date"} aria-label={`Validité du prix ${index + 1}`} onClick={() => setValidityIndex(index)}><CalendarDays size={13} />{offer.valid_until ? offer.valid_until.split("-").reverse().join("/") : offer.valid_from ? offer.valid_from.split("-").reverse().join("/") : "Permanent"}</HButton>,
<div className="catalog-cell-actions"><HButton variant="ghost" size="icon" title="Retirer le fournisseur" aria-label={`Retirer le fournisseur ${index + 1}`} disabled={disabled} onClick={() => setRemoving(index)}><Trash2 size={14} /></HButton></div>
] } })} />{!values.length && <p className="catalog-table-empty">Aucun fournisseur. Renseignez un coût de référence dans Informations.</p>}</div>
    {!disabled && <HButton size="small" disabled={values.length >= 30 || !access.canReadContacts} onClick={() => onChange([...values, { supplier: '', supplier_sku: '', list_price: 0, discount: 0, purchase_quantity: 1, currency, lead_time_days: 0, valid_from: '', valid_until: '', is_preferred: values.length === 0 }])}><Plus size={14} />Ajouter un fournisseur</HButton>}
    {validityIndex !== undefined && values[validityIndex] && <HDialog open title="Validité du prix" description="Ce prix est proposé dans les devis uniquement pendant sa période de validité." onOpenChange={(open) => { if (!open) setValidityIndex(undefined) }}><div className="dialog-form contact-fields"><label><HFieldLabel>Valable du</HFieldLabel><HInput type="date" value={values[validityIndex]!.valid_from} onChange={(event) => patch(validityIndex, { valid_from: event.target.value })} /></label><label><HFieldLabel>Valable jusqu’au</HFieldLabel><HInput type="date" value={values[validityIndex]!.valid_until} onChange={(event) => patch(validityIndex, { valid_until: event.target.value })} /></label></div></HDialog>}
    {removing !== undefined && <HRecordConfirmation open requireText={false} action="delete" itemName="cette ligne fournisseur" description="Le fournisseur sera retiré de la fiche. L’historique de ses prix sera conservé." onOpenChange={(open) => { if (!open) setRemoving(undefined) }} onConfirm={async () => { onChange(values.filter((_, index) => index !== removing)); setRemoving(undefined) }} />}
  </>
}
