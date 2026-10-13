import { CustomerOrderFilePicker } from './CustomerOrderFilePicker'
import { useQuery } from '@tanstack/react-query'
import { stockService } from '../../inventory/services/StockService'
import { PurchasePreparation } from '../../purchasing/components/PurchasePreparation'
import type { PurchasePreparationSelection } from '../../purchasing/schemas/purchasing'
import { StockReservations } from '../../inventory/components/StockReservations'
import { useStockAccess } from '../../inventory/hooks/useStockAccess'
import type { StockSelection } from '../../inventory/schemas/stock'
import { useState, useId } from 'react'
import { ShoppingBag, ShoppingCart, PackageCheck, Hash, Check } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
export function QuoteConfirmation({ quote, busy, error, canPrepare = false, onClose, onConfirm }: { quote: string; busy: boolean; error: string | undefined; canPrepare?: boolean; onClose: () => void; onConfirm: (number: string, file?: File | File[], reservations?: StockSelection[], preparation?: PurchasePreparationSelection[]) => void }) {
  const stock = useStockAccess()
  const availableStock = useQuery({ queryKey: ['inventory', 'reservations', quote], queryFn: () => stockService.reservations(quote), enabled: stock.canReserve, retry: false })
  const hasStock = stock.canReserve && Boolean(availableStock.data?.lines.some((line) => line.reservable && line.capacity > 0 && line.locations.some((location) => location.available > 0)))
  const [reservations, setReservations] = useState<StockSelection[]>([])
  const [reserveReady, setReserveReady] = useState(false), [prepareReady, setPrepareReady] = useState(false)
  const [preparation, setPreparation] = useState<PurchasePreparationSelection[]>([])
  const [update] = useState(() => (selections: StockSelection[]) => { setReservations(selections); setReserveReady(false); setPrepareReady(false) })
  const [number, setNumber] = useState(''), [files, setFiles] = useState<File[]>([])
  const numberId = useId()
  const [reserve, setReserve] = useState(false)
  const [waiting, setWaiting] = useState(false), [prepare, setPrepare] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const reserveActive = reserve && hasStock
  return <HDialog open title="Confirmer la commande client" description="Le devis sera figé et une commande client sera créée avec ses lignes hors options." className={stock.canReserve ? "quote-stock-confirmation" : "quote-confirmation-dialog"} onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (!waiting && !number.trim() || uploadError) return; if (reserveActive && !reserveReady || prepare && !prepareReady) return; onConfirm(waiting ? '' : number.trim(), files, reserveActive ? reservations : [], canPrepare && prepare ? preparation : undefined) }}>
      <div className="quote-command-reference"><label htmlFor={numberId}><HFieldLabel required={!waiting}><Hash size={14} aria-hidden="true" />Numéro de commande client</HFieldLabel></label><div className="quote-command-reference-controls"><HInput id={numberId} autoFocus required={!waiting} maxLength={120} value={waiting ? 'Attente Commande' : number} disabled={busy || waiting} onChange={(event) => setNumber(event.target.value)} placeholder="Référence fournie par le client" /><label className="h-choice"><input type="checkbox" checked={waiting} disabled={busy} onChange={(event) => setWaiting(event.target.checked)} />Attente Commande</label></div></div>
      <CustomerOrderFilePicker files={files} busy={busy} onFiles={(added) => { if (files.length + added.length > 20) { setUploadError('20 pièces maximum.'); return }; setFiles([...files, ...added]) }} onRemove={(index) => { setFiles(files.filter((_, i) => i !== index)); setUploadError('') }} onError={setUploadError} />
      {uploadError && <p role="alert" className="field-error">{uploadError}</p>}
      {availableStock.error && <p role="alert" className="field-error">{availableStock.error.message}<HButton onClick={() => void availableStock.refetch()}>Réessayer</HButton></p>}
      <div className="quote-confirmation-options">
        {canPrepare && <HButton aria-pressed={prepare} variant="secondary" disabled={busy} onClick={() => setPrepare((current) => !current)}><ShoppingCart size={16} />Préparer la commande{prepare && prepareReady && <Check size={14} aria-label="Préparation prête" />}</HButton>}
        {hasStock && <HButton aria-pressed={reserve} variant="secondary" disabled={busy} onClick={() => { setReserve((current) => !current); setReserveReady(false); setPrepareReady(false) }}><PackageCheck size={16} />Réserver le stock disponible{reserve && reserveReady && <Check size={14} aria-label="Réservations prêtes" />}</HButton>}
      </div>
      {hasStock && <StockReservations quote={quote} busy={busy} optional enabled={reserveActive} onChange={update} />}
      {reserveActive && <div className="quote-inline-preparation-actions"><HButton disabled={busy || reservations.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)} onClick={() => setReserveReady(true)}><Check size={14} />{reserveReady ? 'Réservations prêtes' : 'Appliquer les réservations'}</HButton></div>}
      {canPrepare && prepare && <PurchasePreparation quote={quote} reservations={reserveActive ? reservations : []} busy={busy} ready={prepareReady} onChange={() => setPrepareReady(false)} onApply={(lines) => { setPreparation(lines); setPrepareReady(true) }} />}
      {error && <p role="alert" className="field-error">{error}</p>}
      <HDialogFooter><HButton type="submit" variant="primary" disabled={busy || Boolean(uploadError) || !waiting && !number.trim() || reserveActive && !reserveReady || prepare && !prepareReady}><ShoppingBag size={14} />{busy ? 'Confirmation…' : 'Confirmer la commande'}</HButton></HDialogFooter>
    </form>
  </HDialog>
}
