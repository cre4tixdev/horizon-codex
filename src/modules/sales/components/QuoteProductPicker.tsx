import { PackageSearch, Plus } from 'lucide-react'
import { ProductPicker } from '../../../shared/catalog/ProductPicker'
import { HButton } from '../../../shared/ui/HButton'
import { catalogService, useCatalogAccess } from '../../inventory'
import type { QuoteLineInput } from '../schemas/quotes'
export function QuoteProductPicker({ initial, currency, onChoose, onClose }: { initial: { product: string; product_supplier: string }; currency: string; onChoose: (line: Partial<QuoteLineInput>) => void; onClose: () => void }) {
  return <ProductPicker initialProduct={initial.product} usage="sale" actionLabel="au devis" onChoose={async (product) => { const value = await catalogService.quoteLine(product, '', currency); onChoose({ ...value, price_source: 'manual' }) }} onClose={onClose} />
}
export function AddProductButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) { const access = useCatalogAccess(); return access.canRead ? <HButton variant="ghost" size="small" disabled={disabled} onClick={onClick}><PackageSearch size={14} /><Plus size={12} />Ajouter un produit</HButton> : null }
