import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Ruler } from 'lucide-react'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDialog } from '../../../shared/ui/HDialog'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { documentsService } from '../services/DocumentsService'
import { paperFormatInputSchema, type PaperFormat, type PaperFormatInput } from '../schemas/paperFormats'
export function PaperFormatsSettings() {
  const [editing, setEditing] = useState<PaperFormat | 'new' | null>(null)
  const query = useQuery({ queryKey: ['documents', 'paper-formats'], queryFn: () => documentsService.paperFormats(), retry: false })
  return <>
    <HSectionHeading title="Formats d’impression" icon={Ruler} description="Dimensions communes au studio. Un changement ne modifie pas les modèles déjà enregistrés." actions={<HButton size="small" onClick={() => setEditing('new')}><Plus size={14} />Nouveau format</HButton>} />
    {query.error ? <p role="alert" className="field-error">{query.error.message}</p> : !query.data ? <HLoadingIndicator label="Chargement des formats" /> : <HSettingsTable count={query.data.length} noun="format"><table className="reference-table"><thead><tr><th>Format</th><th>Largeur · mm</th><th>Hauteur · mm</th><th className="settings-state-cell">État</th><th className="settings-actions-cell">Actions</th></tr></thead><tbody>{query.data.map((format) => <tr key={format.id}><td>{format.name}</td><td>{format.width_mm.toLocaleString('fr-FR')}</td><td>{format.height_mm.toLocaleString('fr-FR')}</td><td className="settings-state-cell"><HBadge tone={format.active ? 'success' : 'neutral'}>{format.active ? 'Actif' : 'Archivé'}</HBadge></td><td className="settings-actions-cell"><HButton size="icon" variant="ghost" title={`Modifier ${format.name}`} onClick={() => setEditing(format)}><Pencil size={14} /></HButton></td></tr>)}</tbody></table></HSettingsTable>}
    {editing && <PaperFormatEditor record={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
  </>
}
function PaperFormatEditor({ record, onClose }: { record: PaperFormat | undefined; onClose: () => void }) {
  const id = useId(), client = useQueryClient()
  const [input, setInput] = useState<PaperFormatInput>(record || { name: '', width_mm: 95, height_mm: 28, active: true }), [error, setError] = useState('')
  const dirty = !record || JSON.stringify(record) !== JSON.stringify(input)
  const save = useMutation({ mutationFn: () => documentsService.savePaperFormat(input), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['documents', 'paper-formats'] }); onClose() } })
  return <HDialog open title={record ? 'Modifier le format' : 'Nouveau format'} description="Dimensions physiques du papier ou de l’étiquette, en millimètres." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} actions={<HSaveButton form={id} hasChanges={dirty} pending={save.isPending} />}>
    <form id={id} className="dialog-form" onSubmit={(event) => { event.preventDefault(); const parsed = paperFormatInputSchema.safeParse(input); if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Vérifiez les dimensions.'); return }; setError(''); if (dirty && !save.isPending) save.mutate() }}><fieldset className="access-fieldset" disabled={save.isPending}><div className="contact-fields">
      <label className="contact-field-wide"><HFieldLabel required>Nom du format</HFieldLabel><HInput autoFocus required maxLength={80} value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} /></label>
      {(['width_mm', 'height_mm'] as const).map((key) => <label key={key}><HFieldLabel required>{key === 'width_mm' ? 'Largeur (mm)' : 'Hauteur (mm)'}</HFieldLabel><HInput required type="number" min={10} max={1000} step={0.01} value={input[key]} onChange={(event) => setInput({ ...input, [key]: Number(event.target.value) })} /></label>)}
      <label className="contact-checkbox contact-field-wide"><input type="checkbox" checked={input.active} onChange={(event) => setInput({ ...input, active: event.target.checked })} />Disponible dans le studio</label>
    </div></fieldset>{(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}</form>
  </HDialog>
}
