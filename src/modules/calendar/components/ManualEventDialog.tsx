import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HZonedDateInput } from '../../../shared/ui/HZonedDateInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTonePicker } from '../../../shared/ui/HTonePicker'
import { HRecordConfirmation } from '../../../shared/ui/HRecordConfirmation'
import { calendarService } from '../services/CalendarService'
import { manualEventInputSchema, type ManualEvent, type ManualEventInput } from '../schemas/manualEvents'
import { zonedInput, zonedInstant } from '../../../shared/time/zonedDate'
import { useCalendarAccess } from '../hooks/useCalendarAccess'
const iso = (value: string) => value ? new Date(value.replace(' ', 'T')).toISOString() : ''
export function ManualEventDialog({ id, initialDate, onClose }: { id?: string | undefined; initialDate?: string | undefined; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const query = useQuery({ queryKey: ['calendar', 'manual', id], queryFn: () => calendarService.manual(id!), enabled: Boolean(id), retry: false })
  return <HDialog open title={id ? 'Événement du calendrier' : 'Nouvel événement'} description="Un rendez-vous ou une échéance ajoutés au calendrier." onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    {id && query.isPending ? <HLoadingIndicator label="Chargement de l’événement" /> : id && query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <EventForm key={id || initialDate || 'new'} initialDate={initialDate} record={query.data} setBusy={setBusy} onClose={onClose} />}
  </HDialog>
}
function EventForm({ record, initialDate, onClose, setBusy }: { initialDate?: string | undefined; record?: ManualEvent | undefined; setBusy: (busy: boolean) => void; onClose: () => void }) {
  const { canWrite } = useCalendarAccess(), editable = canWrite && (!record || record.editable)
  const formId = useId(), client = useQueryClient()
  const [key] = useState(() => crypto.randomUUID())
  const [input, setInput] = useState<ManualEventInput>(() => record ? { title: record.title, description: record.description, start: iso(record.start), end: iso(record.end), all_day: record.all_day, timezone: record.timezone, location: record.location, visibility: record.visibility, tone: record.tone, color: record.color } : { title: '', description: '', start: initialDate ? `${initialDate}T00:00:00.000Z` : '', end: '', all_day: Boolean(initialDate), timezone: 'Europe/Paris', location: '', visibility: 'private', tone: 'violet', color: '' })
  const [error, setError] = useState(''), [removing, setRemoving] = useState(false)
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['calendar'], predicate: (query) => query.queryKey[1] !== 'manual' }); onClose() }
  const save = useMutation({ mutationFn: () => calendarService.saveManual(input, key, record?.id, record?.updated), onMutate: () => setBusy(true), onSuccess: async (saved) => { client.setQueryData(['calendar', 'manual', saved.id], saved); await refresh() }, onSettled: () => setBusy(false) })
  return <>
    <form id={formId} className="dialog-form" onSubmit={(event) => { event.preventDefault(); const parsed = manualEventInputSchema.safeParse(input); if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Vérifiez les champs.'); return } setError(''); if (editable && !save.isPending) save.mutate() }}>
      <fieldset className="access-fieldset contact-form-grid tender-appointment-fields" disabled={!editable || save.isPending}>
        <label className="tender-appointment-wide"><HFieldLabel required>Titre</HFieldLabel><HInput autoFocus required maxLength={200} value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} /></label>
        <label><HFieldLabel required>Visibilité</HFieldLabel><HCombobox label="Visibilité de l’événement" required clearable={false} showCodes={false} value={input.visibility} options={[{ value: 'private', label: 'Personnel' }, { value: 'team', label: 'Équipe' }]} onChange={(visibility) => { if (visibility === 'private' || visibility === 'team') setInput({ ...input, visibility }) }} /></label>
        <label><HFieldLabel required>Fuseau horaire</HFieldLabel><HCombobox label="Fuseau de l’événement" required clearable={false} showCodes={false} value={input.timezone} options={manualEventInputSchema.shape.timezone.options.map((value) => ({ value, label: value }))} onChange={(value) => { const timezone = manualEventInputSchema.shape.timezone.safeParse(value); if (timezone.success) setInput({ ...input, timezone: timezone.data }) }} /></label>
        <div className="h-form-field tender-appointment-wide"><label className="contact-checkbox"><input type="checkbox" checked={input.all_day} onChange={(event) => { const date = input.all_day ? input.start.slice(0, 10) : zonedInput(input.start, input.timezone).slice(0, 10); setInput({ ...input, all_day: event.target.checked, start: date ? event.target.checked ? `${date}T00:00:00.000Z` : zonedInstant(`${date}T09:00`, input.timezone) : '', end: '' }) }} /> Toute la journée</label></div>
        <label><HFieldLabel required>{input.all_day ? 'Date' : 'Début'}</HFieldLabel>{input.all_day ? <HInput required type="date" value={input.start.slice(0, 10)} onChange={(event) => setInput({ ...input, start: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} /> : <HZonedDateInput required value={input.start} timezone={input.timezone} onChange={(start) => setInput({ ...input, start })} />}</label>
        {!input.all_day && <label><HFieldLabel>Fin</HFieldLabel><HZonedDateInput value={input.end} timezone={input.timezone} onChange={(end) => setInput({ ...input, end })} /></label>}
        <label className="tender-appointment-wide"><HFieldLabel>Lieu ou lien</HFieldLabel><HInput maxLength={500} value={input.location} onChange={(event) => setInput({ ...input, location: event.target.value })} /></label>
        <div className="h-form-field tender-appointment-wide"><label htmlFor={`${formId}-notes`}><HFieldLabel>Notes</HFieldLabel></label><textarea id={`${formId}-notes`} className="h-input" rows={3} maxLength={5000} value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} /></div>
        <div className="tender-appointment-wide"><HTonePicker label="Couleur" value={input.tone} color={input.color} onChange={(tone) => setInput({ ...input, tone, color: '' })} onColorChange={(color) => setInput({ ...input, color })} disabled={!editable || save.isPending} /></div>
      </fieldset>
      {(error || save.error) && <p className="field-error" role="alert">{error || save.error?.message}</p>}
    </form>
    <HDialogFooter>{record && editable && <HButton disabled={save.isPending} aria-label="Supprimer l’événement" onClick={() => setRemoving(true)}><Trash2 size={14} /></HButton>}<HButton disabled={save.isPending} onClick={onClose}>{editable ? 'Annuler' : 'Fermer'}</HButton>{editable && <HSaveButton form={formId} hasChanges pending={save.isPending}>Enregistrer</HSaveButton>}</HDialogFooter>
    {record && <HRecordConfirmation action="delete" requireText={false} itemName={record.title} open={removing} onOpenChange={setRemoving} description="L’événement sera retiré du calendrier ; son historique sera conservé." onConfirm={async () => { await calendarService.removeManual(record.id, record.updated); await refresh() }} />}
  </>
}
