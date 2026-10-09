import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { documentsService } from '../services/DocumentsService'
import { documentFileTypes, filenameFields, filenameExample, type FileSettings } from '../schemas/fileSettings'
export function DocumentFileSettings() {
  const query = useQuery({ queryKey: ['documents', 'file-settings'], queryFn: () => documentsService.fileSettings(), retry: false })
  if (query.error) return <p role="alert" className="field-error">{query.error.message}</p>
  return query.data ? <FileSettingsForm key={query.data.updated} record={query.data} /> : <HLoadingIndicator label="Chargement des formats" />
}
function FileSettingsForm({ record }: { record: FileSettings }) {
  const [patterns, setPatterns] = useState(record.patterns)
  const [target, setTarget] = useState<keyof typeof documentFileTypes>('quote')
  const [insertionError, setInsertionError] = useState('')
  const inputs = useRef<Partial<Record<keyof typeof documentFileTypes, HTMLInputElement>>>({})
  const ranges = useRef<Partial<Record<keyof typeof documentFileTypes, [number, number]>>>({})
  const pendingFocus = useRef<{ type: keyof typeof documentFileTypes; position: number } | null>(null)
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => documentsService.saveFileSettings({ updated: record.updated, patterns }), onSuccess: (saved) => client.setQueryData(['documents', 'file-settings'], saved) })
  const dirty = JSON.stringify(patterns) !== JSON.stringify(record.patterns)
  function insertField(token: string) {
    if (!Object.hasOwn(filenameFields, token)) return
    const value = patterns[target], [start, end] = ranges.current[target] || [value.length, value.length]
    const field = `{${token}}`, next = value.slice(0, start) + field + value.slice(end)
    if (next.length > 120) { setInsertionError('Le format ne peut pas dépasser 120 caractères.'); return }
    setInsertionError(''); setPatterns({ ...patterns, [target]: next })
    pendingFocus.current = { type: target, position: start + field.length }
  }
  return <form onSubmit={(event) => { event.preventDefault(); if (dirty) save.mutate() }}>
    <div className="document-filename-toolbar"><p className="contact-muted">Un format par pièce. <code>{'{number}'}</code> est obligatoire ; l’extension .pdf est ajoutée automatiquement.</p><HSaveButton pending={save.isPending} hasChanges={dirty}>Enregistrer</HSaveButton></div>
    <div className="document-filename-insertion"><span>Ajouter un champ</span><HCombobox label="Format à compléter" value={target} clearable={false} required showCodes={false} disabled={save.isPending} onChange={(value) => { if (Object.hasOwn(documentFileTypes, value)) setTarget(value as keyof typeof documentFileTypes) }} options={Object.entries(documentFileTypes).map(([value, label]) => ({ value, label }))} /><HCombobox label="Insérer un champ" value="" clearable={false} required showCodes={false} disabled={save.isPending} onChange={insertField} onCloseAutoFocus={(event) => {
      const pending = pendingFocus.current
      if (!pending) return
      event.preventDefault()
      inputs.current[pending.type]?.focus()
      inputs.current[pending.type]?.setSelectionRange(pending.position, pending.position)
      pendingFocus.current = null
    }} options={[{ value: '', label: 'Choisir un champ…' }, ...Object.entries(filenameFields).filter(([key]) => key !== 'company').map(([value, field]) => ({ value, label: field.label }))]} /></div>
    {insertionError && <p role="alert" className="field-error">{insertionError}</p>}
    <HSettingsTable count={Object.keys(documentFileTypes).length} noun="format"><table className="reference-table"><thead><tr><th>Pièce</th><th>Format du nom</th><th>Exemple</th></tr></thead><tbody>{(Object.keys(documentFileTypes) as (keyof typeof documentFileTypes)[]).map((type) => <tr key={type}><td>{documentFileTypes[type]}{type !== 'quote' && <small className="contact-muted"> · À venir</small>}</td><td><HInput ref={(node) => { if (node) inputs.current[type] = node; else delete inputs.current[type] }} aria-label={`Nom PDF ${documentFileTypes[type]}`} required maxLength={120} disabled={save.isPending} value={patterns[type]} onFocus={() => setTarget(type)} onSelect={(event) => { ranges.current[type] = [event.currentTarget.selectionStart ?? patterns[type].length, event.currentTarget.selectionEnd ?? patterns[type].length] }} onChange={(event) => { setInsertionError(''); setPatterns({ ...patterns, [type]: event.target.value }) }} /></td><td className="document-filename-example">{filenameExample(patterns[type], type)}</td></tr>)}</tbody></table></HSettingsTable>
    {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
  </form>
}
