import { HDeadline } from '../../../shared/ui/HDeadline'
import { useEffect } from 'react'
import { CalendarDays, ClipboardList } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HZonedDateInput } from '../../../shared/ui/HZonedDateInput'
import { useReferences } from '../../settings/hooks/useReferences'
import { timezones, type TenderInput } from '../schemas/tenders'
export function TenderFields({ value, onChange, disabled }: { value: TenderInput; onChange: (value: TenderInput) => void; disabled: boolean }) {
  const stages = useReferences('crm_tender_statuses')
  useEffect(() => { if (!value.status && stages.data?.some((item) => item.code === 'todo' && item.active)) onChange({ ...value, status: stages.data.find((item) => item.code === 'todo' && item.active)!.id }) }, [value, onChange, stages.data])
  return <section className="contact-panel tender-dossier">
    <HSectionHeading title="Dossier d’appel d’offres" icon={ClipboardList} />
    <div className="tender-dossier-grid">
      <div className="contact-fields tender-dossier-details">
        <label>Référence AO<HInput maxLength={160} value={value.reference} onChange={(event) => onChange({ ...value, reference: event.target.value })} /></label>
        <label><HFieldLabel required>Préparation de la réponse</HFieldLabel><HCombobox label="Préparation de la réponse" required clearable={false} showCodes={false} value={value.status} options={(stages.data || []).filter((item) => item.active || item.id === value.status).map((item) => ({ value: item.id, label: item.label, disabled: !item.active }))} onChange={(status) => onChange({ ...value, status })} disabled={disabled || stages.isPending || Boolean(stages.error)} /></label>
        <label className="tender-field-wide">Lien de consultation<HInput type="url" placeholder="https://…" value={value.consultation_url} onChange={(event) => onChange({ ...value, consultation_url: event.target.value })} /></label>
        <label className="h-choice contact-checkbox tender-field-wide tender-visit-required"><input type="checkbox" disabled={disabled} checked={value.visit_required} onChange={(event) => onChange({ ...value, visit_required: event.target.checked })} />Visite obligatoire</label>
      </div>
      <div className="tender-dossier-schedule">
        <HSectionHeading title="Échéances" icon={CalendarDays} />
        <div className="tender-deadline-panel">
          <HDeadline label="Remise" value={value.submission_deadline} timezone={value.timezone} />
          <label>Date et heure de remise<HZonedDateInput disabled={disabled} value={value.submission_deadline} timezone={value.timezone} onChange={(submission_deadline) => onChange({ ...value, submission_deadline })} /></label>
        </div>
        <div className="contact-fields tender-dossier-dates">
          <label>Publication<HInput type="date" value={value.publication_date.slice(0, 10)} onChange={(event) => onChange({ ...value, publication_date: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} /></label>
          <label>Résultat attendu<HInput type="date" value={value.expected_result_date.slice(0, 10)} onChange={(event) => onChange({ ...value, expected_result_date: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} /></label>
          <label className="tender-field-wide"><HFieldLabel required>Fuseau horaire</HFieldLabel><HCombobox label="Fuseau horaire AO" required clearable={false} showCodes={false} value={value.timezone} options={timezones.map((zone) => ({ value: zone, label: zone }))} onChange={(timezone) => { const selected = timezones.find((zone) => zone === timezone); if (selected) onChange({ ...value, timezone: selected }) }} disabled={disabled} /></label>
        </div>
      </div>
    </div>
    {stages.error && <p role="alert" className="field-error">{stages.error.message}</p>}
  </section>
}
