import { useState } from 'react'
import { AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HInput } from '../../../shared/ui/HInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { ImportDecision } from './ImportDecision'
import { ImportImage } from './ImportImage'
import { targetFields, type ImportJob, type ImportRow } from '../schemas/imports'

export function ImportDetail({ job, row, rows, busy, onResolve, onClose, onChangeRow }: { job: ImportJob; row: ImportRow; rows: ImportRow[]; busy: boolean; onResolve: (row: string, resolution: string, values?: Record<string, string>) => Promise<void>; onClose: () => void; onChangeRow: (id: string) => void }) {
  const [edits, setEdits] = useState<Record<string, string>>({}), [error, setError] = useState(''), [saving, setSaving] = useState(false)
  const index = rows.findIndex((item) => item.id === row.id), locked = busy || saving, editable = job.status === 'preview', dirty = Object.keys(edits).length > 0
  const title = String(row.data.name || [row.data.first_name, row.data.last_name].filter(Boolean).join(' ') || 'Sans nom')
  const save = async () => { if (dirty) { await onResolve(row.id, row.resolution, edits); setEdits({}) } }
  const decide = async (resolution: string) => {
    if (locked) return; setSaving(true); setError('')
    try { await onResolve(row.id, resolution, dirty ? edits : undefined); setEdits({}) } catch (e) { setError(e instanceof Error ? e.message : 'Décision impossible.') } finally { setSaving(false) }
  }
  const move = async (direction: number) => {
    const next = rows[index + direction]; if (!next || locked) return
    setSaving(true); setError('')
    try { await save(); onChangeRow(next.id) } catch (e) { setError(e instanceof Error ? e.message : 'Correction impossible.') } finally { setSaving(false) }
  }
  const close = () => { if (locked) return; if (dirty) { setError('Enregistrez ou annulez vos modifications avant de fermer.'); return } onClose() }
  return <HDialog open onOpenChange={(open) => { if (!open) close() }} title={`Ligne ${row.number} · ${title}`} description={row.error || row.match || 'Comparaison des données avant import.'} className="import-detail-dialog" actions={<nav className="record-navigator" aria-label="Navigation des fiches d’import"><span className="record-navigator-count">Fiche {index + 1} / {rows.length}</span><HButton variant="ghost" size="icon" aria-label="Fiche précédente" title="Fiche précédente" disabled={locked || index <= 0} onClick={() => void move(-1)}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Fiche suivante" title="Fiche suivante" disabled={locked || index < 0 || index >= rows.length - 1} onClick={() => void move(1)}><ChevronRight size={14} /></HButton></nav>}>
    <form className="dialog-form import-detail-form" onSubmit={(event) => { event.preventDefault(); if (locked) return; setSaving(true); setError(''); void save().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Correction impossible.')).finally(() => setSaving(false)) }}>
      <div className="import-detail-body">
        {['error', 'conflict'].includes(row.status) && <div className="import-detail-issue" role="status"><strong><AlertTriangle size={16} />Problème à résoudre</strong><p>{row.error || row.match}</p>{row.candidates.length > 0 && <p>Fiches possibles : {row.candidates.map((candidate) => candidate.label).join(' · ')}</p>}<p>{row.status === 'error' ? 'Corrigez les champs ci-dessous ou ignorez cette ligne.' : 'Choisissez une fiche existante, créez une fiche distincte ou ignorez cette ligne.'}</p></div>}
        {editable && <div className="import-detail-decision"><strong>Action pour cette fiche</strong><ImportDecision row={row} disabled={locked} onChange={(value) => void decide(value)} /></div>}
        {editable && <p className="contact-muted">La croix vide la valeur à importer ; une valeur vide conserve l’existant dans Horizon. Les corrections sont enregistrées avant de passer à une autre fiche.</p>}
        <HSettingsTable><table className="reference-table"><thead><tr><th>Champ</th><th>Actuel dans Horizon</th><th>Valeur à importer</th></tr></thead><tbody>{targetFields[job.type].map((field) => <tr key={field.key}><td>{field.label}</td><td><span className="import-detail-value">{field.key === 'image_base64' ? row.before.image_filename ? 'Image déjà présente dans Horizon' : '—' : String(row.before[field.key] ?? '—')}</span></td><td>{field.key === 'image_base64' ? <div className="import-detail-image">{!row.data.image_base64 && edits.image_base64 === undefined && job.source === 'odoo' && !job.mapped_fields?.includes('image_base64') ? <span>L’image n’a pas été associée dans cette préparation. Relisez Odoo puis vérifiez la correspondance du champ Image.</span> : <ImportImage value={edits.image_base64 ?? String(row.data.image_base64 || '')} />}{editable && (edits.image_base64 ?? row.data.image_base64) && <HButton size="icon" variant="ghost" disabled={locked} aria-label="Effacer la valeur importée : Image (base64)" title="Ne pas importer cette image" onClick={() => setEdits({ ...edits, image_base64: '' })}><X size={13} /></HButton>}</div> : editable && field.key !== 'external_id' ? <HInput aria-label={`Valeur importée : ${field.label}`} value={edits[field.key] ?? String(row.data[field.key] ?? '')} disabled={locked} onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })} onClear={() => setEdits({ ...edits, [field.key]: '' })} clearLabel={`Effacer la valeur importée : ${field.label}`} placeholder="Conserver l’existant" /> : <span className="import-detail-value">{String(row.data[field.key] ?? '—')}</span>}</td></tr>)}</tbody></table></HSettingsTable>
        {row.data.company_label && <p>Société : <strong>{row.data.company_label}</strong></p>}
      </div>
      <HDialogFooter>{error && <p role="alert" className="contact-error">{error}</p>}{dirty && <HButton disabled={locked} onClick={() => { setEdits({}); setError('') }}>Annuler les modifications</HButton>}<HButton disabled={locked} onClick={close}>Fermer</HButton>{editable && <HSaveButton hasChanges={dirty} pending={locked}>Enregistrer les corrections</HSaveButton>}</HDialogFooter>
    </form>
  </HDialog>
}
