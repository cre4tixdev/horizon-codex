import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HTagPicker } from '../../../shared/ui/HTagPicker'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { billingService } from '../services/BillingService'
import type { BillChoices, BillKind, Prepared } from '../schemas/billing'
export function PrepareInvoice({ kind, choices, onPrepared, onClose, initialType = 'order', initialIds = [] }: { kind: BillKind; choices: BillChoices; onPrepared: (value: Prepared) => void; onClose: () => void; initialType?: 'order' | 'operation'; initialIds?: string[] }) {
  const direction = kind.startsWith('supplier') ? 'supplier' : 'customer', [type, setType] = useState(initialType), [ids, setIds] = useState(initialIds), [mode, setMode] = useState<'standard' | 'deposit' | 'balance'>('standard'), [percent, setPercent] = useState(30)
  const options = type === 'order' ? choices.sources[direction] : choices.operations[direction]
  const prepare = useMutation({ mutationFn: () => billingService.prepare(kind, type, ids, mode, percent), onSuccess: onPrepared })
  return <HDialog open description="" title={direction === 'customer' ? 'Préparer une facture client' : 'Rapprocher une facture fournisseur'} onOpenChange={(open) => { if (!open && !prepare.isPending) onClose() }}><div className="dialog-form"><label><HFieldLabel>Source</HFieldLabel><HCombobox label="Type de source" value={type} clearable={false} showCodes={false} options={[{ value: 'order', label: direction === 'customer' ? 'Commandes clients' : 'Commandes fournisseurs' }, { value: 'operation', label: direction === 'customer' ? 'Livraisons réalisées' : 'Réceptions réalisées' }]} onChange={(value) => { setType(value === 'operation' ? 'operation' : 'order'); setIds([]); setMode('standard') }} /></label>
    <HTagPicker label="Pièces à facturer" value={ids} options={options.map((item) => ({ value: item.id, label: item.name, tone: 'blue' }))} onChange={setIds} addLabel="Choisir les pièces…" />
    {type === 'order' && <label><HFieldLabel>Préparation</HFieldLabel><HCombobox label="Mode de facturation" value={mode} clearable={false} showCodes={false} options={[{ value: 'standard', label: 'Lignes restant à facturer' }, { value: 'deposit', label: 'Acompte' }, { value: 'balance', label: 'Solde avec déduction des acomptes' }]} onChange={(value) => setMode(value === 'deposit' ? 'deposit' : value === 'balance' ? 'balance' : 'standard')} /></label>}
    {mode === 'deposit' && <label><HFieldLabel>Pourcentage de l’acompte</HFieldLabel><HInput type="number" aria-label="Pourcentage de l’acompte" min={0.01} max={100} step="any" value={percent} onChange={(event) => setPercent(Number(event.target.value))} /></label>}
    {prepare.error && <p role="alert" className="field-error">{prepare.error.message}</p>}<HDialogFooter><HButton disabled={prepare.isPending} onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={prepare.isPending || !ids.length} onClick={() => prepare.mutate()}>Préparer le brouillon</HButton></HDialogFooter></div></HDialog>
}
