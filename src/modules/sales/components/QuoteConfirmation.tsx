import { StockReservations } from '../../inventory/components/StockReservations'
import { useStockAccess } from '../../inventory/hooks/useStockAccess'
import type { StockSelection } from '../../inventory/schemas/stock'
import { useState } from 'react'
import { Paperclip, ShoppingBag, X } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
export function QuoteConfirmation({ quote, busy, error, onClose, onConfirm }: { quote: string; busy: boolean; error: string | undefined; onClose: () => void; onConfirm: (number: string, file?: File, reservations?: StockSelection[]) => void }) {
  const stock = useStockAccess()
  const [reservations, setReservations] = useState<StockSelection[]>([])
  const [update] = useState(() => (selections: StockSelection[]) => setReservations(selections))
  const [number, setNumber] = useState(''), [file, setFile] = useState<File>()
  return <HDialog open title="Confirmer la commande client" description="Le devis sera figé et une commande client sera créée avec ses lignes hors options." className={stock.canReserve ? "quote-stock-confirmation" : "quote-confirmation-dialog"} onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); onConfirm(number, file, reservations) }}><label><HFieldLabel>Numéro de commande client</HFieldLabel><HInput autoFocus maxLength={120} value={number} disabled={busy} onChange={(event) => setNumber(event.target.value)} placeholder="Référence fournie par le client" /></label>
      <div className="quote-command-upload"><label><Paperclip size={15} /><span>{file ? file.name : 'Ajouter la commande client (PDF ou image)'}</span><input aria-label="Pièce de commande client" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0]); event.target.value = '' }} /></label>{file && <HButton variant="ghost" size="icon" aria-label="Retirer la pièce sélectionnée" disabled={busy} onClick={() => setFile(undefined)}><X size={14} /></HButton>}</div>
      {!number.trim() && !file && <p className="quote-command-pending">Attente Commande · Le numéro et le document client ne sont pas encore renseignés.</p>}
      {stock.canReserve && <StockReservations quote={quote} busy={busy} optional onChange={update} />}
      {error && <p role="alert" className="field-error">{error}</p>}
      <HDialogFooter><HButton type="submit" variant="primary" disabled={busy}><ShoppingBag size={14} />{busy ? 'Confirmation…' : 'Confirmer la commande'}</HButton></HDialogFooter>
    </form>
  </HDialog>
}
