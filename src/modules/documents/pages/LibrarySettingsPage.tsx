import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Folder, Plus, Pencil } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HBadge } from '../../../shared/ui/HBadge'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { useLibraryAccess, useLibraryChoices } from '../hooks/useLibrary'
import { libraryService } from '../services/LibraryService'
import type { LibraryCategory } from '../schemas/library'
export function LibrarySettingsPage() {
  const access = useLibraryAccess(), query = useLibraryChoices(), [editing, setEditing] = useState<LibraryCategory | 'new' | null>(null)
  if (!access.canSettings) return <HEmptyState icon={Folder} title="GED et classement" description="Le paramétrage nécessite l’accréditation GED et l’accès aux paramètres." />
  return <section><HSectionHeading title="Catégories de documents" icon={Folder} description="Classement commun à la bibliothèque GED. Les catégories archivées restent conservées sur les documents existants." actions={<HButton onClick={() => setEditing('new')}><Plus size={14} />Nouvelle catégorie</HButton>} />
    {query.isPending ? <HLoadingIndicator label="Chargement des catégories" /> : query.error ? <p className="field-error" role="alert">{query.error.message}</p> : <HSettingsTable count={query.data.categories.length} noun="catégorie"><table className="reference-table"><thead><tr><th>Catégorie</th><th className="settings-state-cell">État</th><th className="settings-actions-cell">Actions</th></tr></thead><tbody>{query.data.categories.map((c) => <tr key={c.id}><td>{c.name}</td><td className="settings-state-cell"><HBadge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Actif' : 'Archivé'}</HBadge></td><td className="settings-actions-cell"><HButton size="icon" variant="ghost" aria-label={`Modifier ${c.name}`} onClick={() => setEditing(c)}><Pencil size={14} /></HButton></td></tr>)}</tbody></table></HSettingsTable>}
    {editing && <CategoryEditor record={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
  </section>
}
function CategoryEditor({ record, onClose }: { record?: LibraryCategory | undefined; onClose: () => void }) {
  const id = useId(), client = useQueryClient(), [name, setName] = useState(record?.name || ''), [active, setActive] = useState(record?.active ?? true)
  const save = useMutation({ mutationFn: () => libraryService.category({ name, active, ...(record ? { id: record.id, updated: record.updated } : {}) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['ged'] }); onClose() } })
  return <HDialog open title={record ? 'Modifier la catégorie' : 'Nouvelle catégorie'} description="La catégorie classe les fichiers sans modifier leurs versions." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} actions={<HSaveButton form={id} hasChanges={Boolean(name.trim()) && (!record || name !== record.name || active !== record.active)} pending={save.isPending} />}><form id={id} className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><label>Nom de la catégorie<HInput disabled={save.isPending} autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label><label className="contact-checkbox"><input type="checkbox" disabled={save.isPending} checked={active} onChange={(e) => setActive(e.target.checked)} />Catégorie active</label>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</form><HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Annuler</HButton></HDialogFooter></HDialog>
}
