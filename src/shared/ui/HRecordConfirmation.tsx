import { useId, useRef, useState } from 'react'
import { AlertDialog } from 'radix-ui'
import { Archive, Trash2 } from 'lucide-react'
import { HButton } from './HButton'
import { HInput } from './HInput'

export function HRecordConfirmation({ action, itemName, open, onOpenChange, onConfirm, onCloseFocus, description, requireText = true }: { requireText?: boolean; action: 'archive' | 'delete'; itemName: string; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<unknown>; onCloseFocus?: (() => void) | undefined; description?: string }) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const deleting = action === 'delete'
  const word = deleting ? 'SUPPRIMER' : 'ARCHIVER'
  const Icon = deleting ? Trash2 : Archive
  const valid = !requireText || confirmation === word
  async function confirm() {
    if (!valid || pending) return
    setPending(true); setError('')
    try { await onConfirm(); onOpenChange(false); setConfirmation('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'L’action a échoué. Réessayez.') }
    finally { setPending(false) }
  }
  return <AlertDialog.Root open={open} onOpenChange={(next) => { if (pending) return; onOpenChange(next); setConfirmation(''); setError('') }}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="dialog-overlay archive-confirmation-overlay" />
      <AlertDialog.Content className="dialog-content archive-confirmation" data-action={action} onEscapeKeyDown={(event) => { if (pending) event.preventDefault() }} onOpenAutoFocus={(event) => { if (requireText) { event.preventDefault(); input.current?.focus() } }} onCloseAutoFocus={onCloseFocus ? (event) => { event.preventDefault(); onCloseFocus() } : undefined}>
        <div className="dialog-heading"><span className="archive-confirmation-icon" aria-hidden="true"><Icon size={24} /></span><div><AlertDialog.Title>{deleting ? 'Confirmer la suppression' : 'Confirmer l’archivage'}</AlertDialog.Title><AlertDialog.Description>Vous allez {deleting ? requireText ? 'supprimer définitivement' : 'retirer' : 'archiver'} <strong>{itemName}</strong>. {description ?? (deleting ? 'Cette action est irréversible. La suppression sera refusée si une fiche ou une pièce liée existe.' : 'Ses données et relations seront conservées.')}</AlertDialog.Description></div></div>
        <form onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void confirm() }}>
          <>{requireText && <><label htmlFor={id}>Saisissez <strong>{word}</strong> pour confirmer</label>
          <HInput ref={input} id={id} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending} /></>}</>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="archive-confirmation-actions"><AlertDialog.Cancel asChild><HButton disabled={pending}>Annuler</HButton></AlertDialog.Cancel><HButton type="submit" variant={valid && !pending ? 'primary' : 'secondary'} disabled={!valid || pending}><Icon size={14} />{pending ? deleting ? 'Suppression…' : 'Archivage…' : deleting ? 'Supprimer' : 'Archiver'}</HButton></div>
        </form>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
}
