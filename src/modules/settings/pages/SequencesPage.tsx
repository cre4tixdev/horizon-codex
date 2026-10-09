import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { hasPermission } from '../../../core/auth/types/session'
import { useId, useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Hash, ListOrdered, LockKeyhole } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HDialog } from '../../../shared/ui/HDialog'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { SettingsEditButton } from '../components/SettingsEditButton'
import { sequencesService } from '../services/SequencesService'
import { sequenceLabel, sequencePreview, type NumberingSequence, type SequenceInput } from '../schemas/sequences'
export function SequencesPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const query = useQuery({ queryKey: ['settings', 'sequences'], queryFn: sequencesService.list, enabled: allowed })
  const [editor, setEditor] = useState<NumberingSequence>()
  if (!allowed) return <HEmptyState icon={ListOrdered} title="Séquences" description="Vous ne disposez pas de la permission de configurer les séquences." />
  return <section><div className="settings-crm-heading"><HSectionHeading icon={ListOrdered} title="Séquences" description="Numéros de départ, prochains numéros et formats des pièces Horizon." /></div>
    <p className="contact-muted">Les séquences apparaissent à mesure que les modules sont activés. Les changements concernent uniquement les futures pièces.</p>
    {query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message} <HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <HSettingsTable count={query.data.length} noun="séquence"><table className="reference-table"><thead><tr><th>Pièce</th><th>Départ</th><th>Suivante</th><th>Prochain numéro</th><th className="settings-state-cell">État</th><th className="settings-action-cell">Actions</th></tr></thead><tbody>{query.data.map((record) => <tr key={record.id}><td>{sequenceLabel(record.entity_type)}</td><td>{record.start_value}</td><td>{record.next_value}</td><td><strong>{sequencePreview(record)}</strong></td><td className="settings-state-cell">{record.active ? 'Active' : 'Inactive'}</td><td className="settings-action-cell"><SettingsEditButton label={sequenceLabel(record.entity_type)} onClick={() => setEditor(record)} /></td></tr>)}</tbody></table>{query.data.length === 0 && <p className="contact-muted">Aucune séquence disponible.</p>}</HSettingsTable>}
    {editor && <SequenceEditor record={editor} onClose={() => setEditor(undefined)} />}
  </section>
}
function SequenceEditor({ record, onClose }: { record: NumberingSequence; onClose: () => void }) {
  const formId = useId()
  const initial: SequenceInput = { start_value: record.start_value, next_value: record.next_value, prefix: record.prefix, suffix: record.suffix, padding: record.padding }
  const [input, setInput] = useState(initial)
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => sequencesService.save(record, input), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['settings', 'sequences'] }); onClose() } })
  const changed = input.start_value !== initial.start_value || input.next_value !== initial.next_value || input.prefix !== initial.prefix || input.suffix !== initial.suffix || input.padding !== initial.padding
  return <HDialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} title={`Séquence · ${sequenceLabel(record.entity_type)}`} description="Ces réglages concernent uniquement les futures pièces.">
    <form id={formId} className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (changed && !save.isPending) save.mutate() }}>
      <fieldset className="settings-sequence-fields" disabled={save.isPending}>
        <section><HSectionHeading icon={ListOrdered} title="Compteur" />
          <div className="contact-form-grid settings-sequence-counters">
            <label><HFieldLabel required>Numéro de départ</HFieldLabel><HInput type="number" required min="1" max="999999999998" step="1" disabled={record.has_issued} value={input.start_value} onChange={(event) => { const value = Number(event.target.value); setInput({ ...input, start_value: value, next_value: input.next_value === input.start_value ? value : input.next_value }) }} /></label>
            <label><HFieldLabel required>Prochaine valeur</HFieldLabel><HInput type="number" required min={record.has_issued ? record.next_value : input.start_value} max="999999999998" step="1" value={input.next_value} onChange={(event) => setInput({ ...input, next_value: Number(event.target.value) })} /></label>
          </div>
          {record.has_issued && <p className="settings-sequence-notice contact-muted"><LockKeyhole size={13} aria-hidden="true" />Départ figé après utilisation. La prochaine valeur peut uniquement avancer.</p>}
        </section>
        <section><HSectionHeading icon={Hash} title="Format du numéro" />
          <div className="contact-form-grid settings-sequence-format">
            <label>Préfixe<HInput maxLength={20} placeholder="Facultatif" value={input.prefix} onChange={(event) => setInput({ ...input, prefix: event.target.value })} /></label>
            <label><HFieldLabel required>Nombre de chiffres</HFieldLabel><HInput type="number" required min="1" max="12" step="1" value={input.padding} onChange={(event) => setInput({ ...input, padding: Number(event.target.value) })} /></label>
            <label>Suffixe<HInput maxLength={20} placeholder="Facultatif" value={input.suffix} onChange={(event) => setInput({ ...input, suffix: event.target.value })} /></label>
          </div>
        </section>
      </fieldset>
      <p className="settings-sequence-preview" aria-live="polite"><span>Prochain numéro</span><strong>{sequencePreview(input)}</strong></p>
      {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
    </form>
    <HDialogFooter><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton><HSaveButton form={formId} hasChanges={changed} pending={save.isPending}>Enregistrer</HSaveButton></HDialogFooter>
  </HDialog>
}
