import { useReferences } from '../../settings/hooks/useReferences'
import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, CalendarDays } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HInput } from '../../../shared/ui/HInput'
import { HZonedDateInput } from '../../../shared/ui/HZonedDateInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HTagPicker } from '../../../shared/ui/HTagPicker'
import { HTag } from '../../../shared/ui/HTag'
import { displayDate } from '../../../shared/time/zonedDate'
import { useHrDirectory } from '../../hr'
import { employeeName } from '../../hr/schemas/employees'
import { tenderService } from '../services/TenderService'
import { appointmentInputSchema, timezones, type Appointment, type AppointmentInput, type Tender } from '../schemas/tenders'
const states = { planned: 'Prévu', done: 'Réalisé', cancelled: 'Annulé' }
export function TenderAppointments({ tender, editable, hrAllowed }: { tender: Tender | undefined; editable: boolean; hrAllowed: boolean }) {
  const kinds = useReferences('crm_appointment_kinds')
  const tenderId = tender?.id || ''
  const query = useQuery({ queryKey: ['crm', 'appointments', tenderId], queryFn: () => tenderService.appointments(tenderId), enabled: Boolean(tenderId), retry: false, refetchInterval: 30_000 })
  const [editor, setEditor] = useState<Appointment | 'new'>()
  const columns: ColumnDef<Appointment>[] = [
    { header: 'Rendez-vous', accessorKey: 'kind', cell: ({ row }) => { const kind = kinds.data?.find((item) => item.code === row.original.kind); return <HTag color={kind?.color} tone={kind?.tone || (row.original.kind === 'hearing' ? 'violet' : 'blue')}>{kind?.label || (row.original.kind === 'hearing' ? 'Soutenance' : 'Visite')}</HTag> } },
    { header: 'Date', accessorKey: 'start', cell: ({ row }) => displayDate(row.original.start, row.original.timezone) },
    { header: 'Lieu / lien', accessorKey: 'location' },
    { header: 'Participants', accessorKey: 'participants', cell: ({ row }) => row.original.participants.length },
    { header: 'État', accessorKey: 'status', cell: ({ row }) => states[row.original.status] },
  ]
  return <section className="contact-panel tender-appointments"><HSectionHeading title="Visites et soutenances" icon={CalendarDays} count={query.data?.length} actions={editable && tender && <HButton size="small" onClick={() => setEditor('new')}><Plus size={14} />Ajouter un rendez-vous</HButton>} />{!tender && <p className="contact-muted">Enregistrez le dossier pour planifier une visite ou une soutenance.</p>}{tender && query.isPending && <HLoadingIndicator label="Chargement des rendez-vous" />}{kinds.error && <p role="alert" className="field-error">{kinds.error.message}<HButton onClick={() => void kinds.refetch()}>Réessayer</HButton></p>}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}{query.data && <HDataTable data={query.data} columns={columns} getRowAction={(record) => ({ label: `Ouvrir ${record.kind === 'visit' ? 'la visite' : 'la soutenance'} du ${displayDate(record.start, record.timezone)}`, onClick: () => setEditor(record) })} />}{query.data && !query.data.length && <p className="contact-muted">Aucun rendez-vous planifié.</p>}{editor && tender && <AppointmentEditor tender={tender} record={editor === 'new' ? undefined : editor} editable={editable} hrAllowed={hrAllowed} onClose={() => setEditor(undefined)} />}</section>
}
function AppointmentEditor({ tender, record, editable, hrAllowed, onClose }: { tender: Tender; record: Appointment | undefined; editable: boolean; hrAllowed: boolean; onClose: () => void }) {
  const formId = useId()
  const [initial] = useState<AppointmentInput>(() => record ? appointmentInputSchema.parse(record) : { kind: 'visit', start: '', end: '', timezone: tender.timezone, location: '', notes: '', participants: [], status: 'planned' })
  const [input, setInput] = useState(initial)
  const [error, setError] = useState('')
  const client = useQueryClient()
  const directory = useHrDirectory(hrAllowed)
  const save = useMutation({ mutationFn: () => tenderService.saveAppointment(tender.id, input, record), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['crm', 'appointments'] }), client.invalidateQueries({ queryKey: ['calendar'] }), client.invalidateQueries({ queryKey: ['activity'] })]); onClose() } })
  const dirty = JSON.stringify(initial) !== JSON.stringify(input)
  const options = (directory.data?.employees || []).filter((item) => item.status === 'active' || input.participants.includes(item.id)).map((item) => ({ value: item.id, label: employeeName(item), tone: 'pink' as const }))
  for (const id of input.participants) if (!options.some((item) => item.value === id)) options.push({ value: id, label: 'Participant non accessible', tone: 'pink' as const })
  return <HDialog open title={record ? 'Rendez-vous AO' : 'Nouveau rendez-vous AO'} description="Visite ou soutenance : date, lieu et participants." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}>
    <form id={formId} className="dialog-form" onSubmit={(event) => {
      event.preventDefault()
      const parsed = appointmentInputSchema.safeParse(input)
      if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Vérifiez le rendez-vous.'); return }
      setError('')
      if (dirty && editable) save.mutate()
    }}>
      <fieldset className="access-fieldset contact-form-grid tender-appointment-fields" disabled={!editable || save.isPending}>
        <label><HFieldLabel required>Type de rendez-vous</HFieldLabel>
          <HCombobox label="Type de rendez-vous" required clearable={false} showCodes={false} value={input.kind} options={[{ value: 'visit', label: 'Visite' }, { value: 'hearing', label: 'Soutenance' }]} onChange={(kind) => { if (kind === 'visit' || kind === 'hearing') setInput({ ...input, kind }) }} />
        </label>
        <label><HFieldLabel required>État du rendez-vous</HFieldLabel>
          <HCombobox label="État du rendez-vous" required clearable={false} showCodes={false} value={input.status} options={Object.entries(states).map(([value, label]) => ({ value, label }))} onChange={(status) => { if (status === 'planned' || status === 'done' || status === 'cancelled') setInput({ ...input, status }) }} />
        </label>
        <label><HFieldLabel required>Date et heure</HFieldLabel>
          <HZonedDateInput required value={input.start} timezone={input.timezone} onChange={(start) => setInput({ ...input, start, end: '' })} />
        </label>
        <label><HFieldLabel required>Fuseau horaire</HFieldLabel>
          <HCombobox label="Fuseau du rendez-vous" required clearable={false} showCodes={false} value={input.timezone} options={timezones.map((zone) => ({ value: zone, label: zone }))} onChange={(timezone) => { const selected = timezones.find((zone) => zone === timezone); if (selected) setInput({ ...input, timezone: selected }) }} />
        </label>
        <label className="tender-appointment-wide">Lieu ou lien de visioconférence
          <HInput value={input.location} onChange={(event) => setInput({ ...input, location: event.target.value })} maxLength={500} placeholder="Adresse, salle ou lien de réunion" />
        </label>
        <div className="h-form-field tender-appointment-wide"><span>Participants</span>
          <HTagPicker label="Participants du rendez-vous" addLabel="Choisir les participants…" value={input.participants} options={options} onChange={(participants) => setInput({ ...input, participants })} disabled={!editable || !hrAllowed || save.isPending || Boolean(directory.error)} />
        </div>
        <label className="tender-appointment-wide">Notes
          <textarea className="h-input" rows={3} value={input.notes} maxLength={5000} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Accès au site, consignes ou points à préparer…" />
        </label>
      </fieldset>
      {directory.error && <p role="alert" className="field-error">{directory.error.message}</p>}
      {(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}
    </form>
    <HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>{editable ? 'Annuler' : 'Fermer'}</HButton>{editable && <HSaveButton form={formId} hasChanges={dirty} pending={save.isPending}>Enregistrer</HSaveButton>}</HDialogFooter>
  </HDialog>
}
