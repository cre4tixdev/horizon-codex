import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HRichTextEditor } from '../../../shared/ui/HRichTextEditor'
import { documentText, plainTextDocument, type RichTextNode } from '../../../shared/schemas/richText'
import type { MailSignature, PersonalSignatureInput } from '../schemas/mail'

/** Same signature editor for administrator and personal ownership policies. */
export function MailSignatureDialog({ record, variables, users, onSave, onClose, onSaved, onPreview }: { record?: MailSignature | undefined; variables: string[]; users?: { id: string; name: string }[]; onSave: (input: PersonalSignatureInput, user: string) => Promise<unknown>; onClose: () => void; onSaved: () => void; onPreview?: (body: RichTextNode) => Promise<RichTextNode> }) {
  const formId = useId(), initial = { name: record?.name || '', body_json: record?.body_json || plainTextDocument(''), active: record?.active ?? true, is_default: record?.is_default ?? !users }
  const [input, setInput] = useState(initial), [user, setUser] = useState(record?.user || '')
  const dirty = !record || JSON.stringify(input) !== JSON.stringify(initial) || user !== record.user
  const save = useMutation({ mutationFn: () => onSave(input, user), onSuccess: onSaved })
  const preview = useMutation({ mutationFn: () => onPreview ? onPreview(input.body_json) : Promise.resolve(input.body_json) })
  return <><HDialog open title={users ? 'Signature' : 'Ma signature e-mail'} description="Les e-mails déjà préparés ou envoyés conservent leur signature." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><form id={formId} className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (dirty) save.mutate() }}><HSectionHeading title="Signature" actions={<HSaveButton form={formId} hasChanges={dirty} pending={save.isPending} />} /><fieldset className="access-fieldset contact-main-column" disabled={save.isPending}>
    <label className="h-form-field"><HFieldLabel required>Nom</HFieldLabel><HInput aria-label="Nom de la signature" required maxLength={120} value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} /></label>
    {users && <label className="h-form-field"><HFieldLabel>Utilisateur</HFieldLabel><HCombobox label="Utilisateur de la signature" showCodes={false} value={user || 'company'} required clearable={false} options={[{ value: 'company', label: 'Société · tous les utilisateurs' }, ...users.map((item) => ({ value: item.id, label: item.name }))]} onChange={(value) => setUser(value === 'company' ? '' : value)} /></label>}
    <HRichTextEditor label="Contenu de la signature" value={input.body_json} text={documentText(input.body_json)} variables={variables} onChange={(body_json) => setInput({ ...input, body_json })} />
    <label className="h-choice"><input type="checkbox" checked={input.is_default} onChange={(event) => setInput({ ...input, is_default: event.target.checked })} />Par défaut</label>
    <label className="h-choice"><input type="checkbox" checked={input.active} onChange={(event) => setInput({ ...input, active: event.target.checked })} />Active</label>
    {onPreview && <HButton onClick={() => preview.mutate()} disabled={preview.isPending}><Eye size={14} />Aperçu avec des données d’exemple</HButton>}
    </fieldset>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}{preview.error && <p role="alert" className="field-error">{preview.error.message}</p>}<HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Fermer</HButton></HDialogFooter></form></HDialog>
    {preview.data && <HDialog open title="Aperçu de l’e-mail" description="Données d’exemple, aucun e-mail n’est envoyé." onOpenChange={(open) => { if (!open) preview.reset() }}><div className="dialog-form"><HRichTextEditor label="Aperçu du contenu" value={preview.data} text={documentText(preview.data)} disabled onChange={() => undefined} /></div><HDialogFooter><HButton onClick={() => preview.reset()}>Fermer</HButton></HDialogFooter></HDialog>}
  </>
}
