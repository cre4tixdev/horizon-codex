import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HAttachmentWorkspace } from '../../../shared/ui/HAttachmentWorkspace'
import { activityFilename, useActivityAttachment } from '../../../shared/activity/useActivityAttachment'
import { CustomerOrderFilePicker } from './CustomerOrderFilePicker'
import { salesService } from '../services/SalesService'
import type { Quote } from '../schemas/quotes'
export function CustomerOrderAttachmentDialog({ record, canEdit, onSaved, onClose }: { record: Quote; canEdit: boolean; onSaved: (record: Quote) => Promise<void>; onClose: () => void }) {
  const existing = record.order?.documents.length ? record.order.documents : (record.order?.files || []).map((file) => ({ file, event_id: record.order?.event_id || '' }))
  const [pending, setPending] = useState<{ id: string; file: File }[]>([]), [removed, setRemoved] = useState<string[]>([]), [selected, setSelected] = useState(existing[0]?.event_id || ''), [error, setError] = useState('')
  const active = existing.filter((item) => !removed.includes(item.event_id)), ids = [...active.map((item) => item.event_id), ...pending.map((item) => item.id)], selectedId = ids.includes(selected) ? selected : ids[0] || ''
  const stored = active.find((item) => item.event_id === selectedId), attachment = useActivityAttachment(stored?.event_id || '', stored?.file || '')
  const save = useMutation({ mutationFn: () => salesService.customerOrderDocuments(record.id, record.updated, record.order?.customer_number || '', pending.map((item) => item.file), removed), onSuccess: async (value) => { await onSaved(value); onClose() } })
  const changed = Boolean(pending.length || removed.length), busy = save.isPending
  const documents = [...active.map((item) => ({ id: item.event_id, name: activityFilename(item.file), source: item.event_id === selectedId ? attachment.data : undefined, pdf: /\.pdf$/i.test(item.file) })), ...pending.map((item) => ({ id: item.id, name: item.file.name, source: item.file, pdf: item.file.type === 'application/pdf', status: 'À enregistrer' }))]
  return <HDialog open className="h-attachment-dialog" title={existing.length ? 'Pièces de commande client' : 'Joindre les pièces de commande client'} description="Ajoutez des fichiers et sélectionnez une pièce pour afficher son aperçu." onOpenChange={(open) => { if (!open && !busy) onClose() }}><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (canEdit && changed && !error) save.mutate() }}>
    <HAttachmentWorkspace files={documents} selectedId={selectedId} onSelect={setSelected} loading={Boolean(stored && attachment.isPending)} error={attachment.error ? 'Fichier indisponible. Réessayez.' : undefined} disabled={busy} onRemove={canEdit ? (id) => { if (pending.some((item) => item.id === id)) setPending(pending.filter((item) => item.id !== id)); else setRemoved([...removed, id]); setError('') } : undefined} upload={canEdit ? <CustomerOrderFilePicker compact busy={busy} onFiles={(files) => { if (ids.length + files.length > 20) { setError('20 pièces maximum.'); return }; const added = files.map((file) => ({ id: crypto.randomUUID(), file })); setPending([...pending, ...added]); setSelected(added[0]!.id) }} onError={setError} /> : undefined}>
      {removed.length > 0 && <p role="status" className="contact-muted">{removed.length} pièce(s) seront retirées après enregistrement.</p>}
      {canEdit && changed && <HButton size="small" disabled={busy} onClick={() => { setPending([]); setRemoved([]); setSelected(existing[0]?.event_id || ''); setError('') }}>Annuler les changements de pièces</HButton>}
    </HAttachmentWorkspace>
    {(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}<HDialogFooter><HButton disabled={busy} onClick={onClose}>{canEdit ? 'Annuler' : 'Fermer'}</HButton>{canEdit && <HButton type="submit" variant="primary" disabled={!changed || Boolean(error) || busy}>{existing.length ? 'Enregistrer' : 'Joindre les documents'}</HButton>}</HDialogFooter>
  </form></HDialog>
}
