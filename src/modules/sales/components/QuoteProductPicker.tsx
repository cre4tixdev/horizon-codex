import { ProductPicker } from '../../../shared/catalog/ProductPicker'
import { catalogService } from '../../inventory'
import type { QuoteLineInput } from '../schemas/quotes'
export function QuoteProductPicker({ initial, currency, onChoose, onClose }: { initial: { product: string; product_supplier: string }; currency: string; onChoose: (line: Partial<QuoteLineInput>) => void; onClose: () => void }) {
  return <ProductPicker initialProduct={initial.product} usage="sale" actionLabel="au devis" onChoose={async (product) => { const value = await catalogService.quoteLine(product, '', currency); onChoose({ ...value, price_source: 'manual' }) }} onClose={onClose} />
}
