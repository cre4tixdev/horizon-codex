import { useState } from 'react'
import { ProductPicker } from '../../../shared/catalog/ProductPicker'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { QuoteTemplatePreview } from './QuoteTemplatePreview'
import { catalogService } from '../../inventory'
import { emptyQuoteLine, type QuoteLineInput } from '../schemas/quotes'
import { formatAmount } from '../../../shared/formatters/money'
type Choice = { parent: Partial<QuoteLineInput>; children: QuoteLineInput[] }
export function QuoteProductPicker({ initial, currency, componentsOnly = false, maxRows = 200, onChoose, onClose }: { initial: { product: string; product_supplier: string }; currency: string; componentsOnly?: boolean; maxRows?: number; onChoose: (line: Partial<QuoteLineInput>, children: QuoteLineInput[]) => void; onClose: () => void }) {
  const [kit, setKit] = useState<Choice>()
  if (kit) return <HDialog open title={kit.parent.description || 'Ajouter un kit'} description="La composition sera copiée dans le devis et restera modifiable pour cette affaire." className="quote-template-preview-dialog" onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form"><QuoteTemplatePreview lines={kit.children} currency={currency} /><div className="sales-quote-totals"><span>Prix HT du kit</span><strong>{formatAmount(kit.parent.unit_price || 0, currency)}</strong></div><p className="contact-muted">Les quantités affichées sont celles d’un kit. Le montant est porté uniquement par la ligne du kit.</p></div><HDialogFooter><HButton onClick={onClose}>Annuler</HButton><HButton variant="primary" onClick={() => { onChoose(kit.parent, kit.children); onClose() }}>Ajouter le kit au devis</HButton></HDialogFooter></HDialog>
  return <ProductPicker initialProduct={initial.product} usage="sale" kitsTab={!componentsOnly} actionLabel="au devis" onChoose={async (product) => {
    const value = await catalogService.quoteLine(product, '', currency), { kit_lines, ...parent } = value
    if ((kit_lines?.length || 0) + 1 > maxRows) throw new Error('La composition dépasserait les 200 lignes du devis. Retirez des lignes avant de l’ajouter.')
    if (kit_lines?.length) {
      if (componentsOnly) throw new Error('Choisissez un produit simple : les kits imbriqués ne sont pas autorisés.')
      setKit({ parent: { ...parent, price_source: parent.price_source || 'manual' }, children: kit_lines.map((line) => ({ ...emptyQuoteLine(), ...line })) }); return false
    }
    onChoose({ ...parent, price_source: 'manual' }, []); return undefined
  }} onClose={() => { if (!kit) onClose() }} />
}
