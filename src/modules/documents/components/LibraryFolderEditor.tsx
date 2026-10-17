import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { LibraryReaders } from './LibraryReaders'
import { libraryService } from '../services/LibraryService'
import { documentSpaces, folderPath, type LibraryChoices, type LibraryFolder, type LibraryInput } from '../schemas/library'
export function LibraryFolderEditor({ record, choices, space, parent, onClose }: { record?: LibraryFolder | undefined; choices: LibraryChoices; space: LibraryInput['space']; parent: string; onClose: () => void }) {
  const id = useId(), client = useQueryClient(), [input, setInput] = useState({ name: record?.name || '', space: record?.space || space, parent: record?.parent || parent, visibility: record?.visibility || 'team', readers: record?.readers || [], active: record?.active ?? true })
  const save = useMutation({ mutationFn: () => libraryService.folder({ ...input, ...(record ? { id: record.id, updated: record.updated } : {}) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['ged'] }); onClose() } })
  return <HDialog open title={record ? 'Modifier le dossier' : 'Nouveau dossier'} description="Les restrictions d’un dossier s’appliquent aussi à ses sous-dossiers et documents." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} actions={<HSaveButton form={id} hasChanges={Boolean(input.name.trim())} pending={save.isPending} />}><form id={id} className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><fieldset className="access-fieldset" disabled={save.isPending}><div className="contact-fields">
    <label className="contact-field-wide">Nom du dossier<HInput autoFocus required maxLength={120} value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} /></label>
    <label className="contact-field-wide">Espace<HCombobox label="Espace du dossier" showCodes={false} required disabled={Boolean(record)} value={input.space} options={Object.entries(documentSpaces).map(([value, label]) => ({ value, label }))} onChange={(value) => { if (value === 'affairs' || value === 'customers' || value === 'suppliers' || value === 'internal') setInput({ ...input, space: value, parent: '' }) }} /></label>
    <label className="contact-field-wide">Dossier parent<HCombobox label="Dossier parent" showCodes={false} disabled={Boolean(record)} value={input.parent} options={choices.folders.filter((f) => f.space === input.space && f.active).map((f) => ({ value: f.id, label: folderPath(choices.folders, f.id) }))} emptyLabel="Racine de l’espace" onChange={(parent) => setInput({ ...input, parent })} /></label>
    <label className="contact-field-wide">Visibilité<HCombobox label="Visibilité du dossier" showCodes={false} required value={input.visibility} options={[{ value: 'team', label: 'Équipe' }, { value: 'restricted', label: 'Restreint' }]} onChange={(v) => setInput({ ...input, visibility: v === 'restricted' ? 'restricted' : 'team' })} /></label>
    {input.visibility === 'restricted' && <div className="contact-field-wide"><LibraryReaders value={input.readers} initial={record?.reader_names || []} onChange={(readers) => setInput({ ...input, readers })} /></div>}
    {record && <label className="contact-checkbox contact-field-wide"><input type="checkbox" checked={input.active} onChange={(e) => setInput({ ...input, active: e.target.checked })} />Dossier actif</label>}
  </div></fieldset>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</form><HDialogFooter><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton></HDialogFooter></HDialog>
}
