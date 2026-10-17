import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HFilePicker } from '../../../shared/ui/HFilePicker'
import { libraryService } from '../services/LibraryService'
import { gedExtensions, gedFormats, type LibraryFile } from '../schemas/library'
export function LibraryVersionEditor({ record, onClose }: { record: LibraryFile; onClose: () => void }) {
  const id = useId(), client = useQueryClient(), [file, setFile] = useState<File>(), [note, setNote] = useState(''), [error, setError] = useState('')
  const save = useMutation({ mutationFn: () => { if (!file) throw new Error('Choisissez le nouveau fichier.'); return libraryService.version(record.id, record.updated, note, file) }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['ged'] }); await client.invalidateQueries({ queryKey: ['activity'] }); onClose() } })
  return <HDialog open title="Nouvelle version" description={`La version ${record.current.number} et son fichier resteront conservés.`} onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} actions={<HSaveButton form={id} hasChanges={Boolean(file && note.trim())} pending={save.isPending} />}><form id={id} className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><div className="contact-fields"><div className="contact-field-wide"><HFilePicker label="Fichier de la nouvelle version" extensions={gedExtensions} formatsLabel={gedFormats} compact file={file} busy={save.isPending} onChange={setFile} onError={setError} /></div><label className="contact-field-wide">Ce qui a changé<textarea disabled={save.isPending} className="h-input" required rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>{file && <p className="contact-muted">{file.name}</p>}</div>{(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}</form><HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Annuler</HButton></HDialogFooter></HDialog>
}
