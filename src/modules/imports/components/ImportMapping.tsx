import { ImportImage } from './ImportImage'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { importsService } from '../services/ImportsService'
import { modeDescriptions, modeOptions, targetFields, type ImportType, type ImportMode, type SourceData } from '../schemas/imports'
export function ImportMapping({ owner, type, source, mapping, mode, onMapping, onMode, lockIdentity }: { lockIdentity: boolean; owner: string; type: ImportType; source: SourceData; mapping: Record<string, number>; mode: ImportMode; onMapping: (value: Record<string, number>) => void; onMode: (value: ImportMode) => void }) {
  const profiles = useQuery({ queryKey: ['contact-import-profiles', owner], queryFn: () => importsService.profiles(), retry: false })
  const [profile, setProfile] = useState(''), [save, setSave] = useState(false), [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const saveProfile = async () => {
    setBusy(true); setError('')
    try { await importsService.saveProfile({ name, type, headers: source.headers, mapping, mode }); await profiles.refetch(); setSave(false); setName('') } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.') } finally { setBusy(false) }
  }
  return <section className="contact-panel">
    <HSectionHeading title="Correspondance des colonnes" description="Vérifiez les associations proposées. Les colonnes ignorées et les cellules vides ne modifient aucune valeur existante." actions={<HButton size="small" onClick={() => setSave(true)}><Save size={14} />Mémoriser le mapping</HButton>} />
    <div className="import-controls"><label>Profil d’import<HCombobox label="Profil d’import" value={profile} options={(profiles.data || []).filter((p) => p.type === type).map((p) => ({ value: p.id, label: p.name }))} emptyLabel="Choisir un profil enregistré" showCodes={false} onChange={(id) => { setProfile(id); const p = profiles.data?.find((p) => p.id === id); if (!p) return; if (JSON.stringify(p.headers) !== JSON.stringify(source.headers)) { setError('Les colonnes de ce fichier diffèrent du profil. Vérifiez le mapping manuellement.'); return } if (lockIdentity && p.mapping.external_id !== source.headers.indexOf('external_id')) { setError('Ce profil ne conserve pas l’identifiant Odoo. Vérifiez les associations manuellement.'); return } onMapping(p.mapping); onMode(p.mode); setError('') }} /></label><label>Mode d’import<HCombobox label="Mode d’import" value={mode} showCodes={false} required clearable={false} options={modeOptions} onChange={(v) => onMode(v === 'create' || v === 'update' ? v : 'upsert')} /></label></div>
    <p className="contact-muted">{modeDescriptions[mode]} Les cellules vides conservent les valeurs existantes.</p>
    {lockIdentity && <p className="contact-muted">Les références Odoo sont conservées séparément : les identifiants Horizon restent inchangés. Importez les sociétés avant leurs contacts pour retrouver automatiquement leur rattachement.</p>}
    {profiles.error && <p role="alert">{profiles.error.message}</p>}{error && <p role="alert">{error}</p>}
    <HSettingsTable><table className="reference-table"><thead><tr><th>Colonne du fichier</th><th>Exemple</th><th>Champ Horizon</th></tr></thead><tbody>{source.headers.map((header, index) => <tr key={index}><td><strong>{header}</strong></td><td>{mapping.image_base64 === index ? <ImportImage compact value={source.rows.find((r) => r[index])?.[index] || ''} /> : <span className="import-cell" title={source.rows.find((r) => r[index])?.[index]}>{source.rows.find((r) => r[index])?.[index] || '—'}</span>}</td><td><HCombobox label={`Champ Horizon pour ${header} (${index + 1})`} value={Object.entries(mapping).find(([, column]) => column === index)?.[0] || ''} emptyLabel="Ignorer cette colonne" showCodes={false} disabled={lockIdentity && index === source.headers.indexOf('external_id')} options={targetFields[type].filter((f) => !lockIdentity || f.key !== 'external_id' || index === source.headers.indexOf('external_id')).map((f) => ({ value: f.key, label: f.label }))} onChange={(key) => { const next = Object.fromEntries(Object.entries(mapping).filter(([, column]) => column !== index)); if (key) next[key] = index; onMapping(next) }} /></td></tr>)}</tbody></table></HSettingsTable>
    <p className="contact-muted">{Object.keys(mapping).length} champ(s) associé(s) · {source.rows.length} ligne(s). {type === 'companies' ? 'Pour créer une société, associez son nom. Les rôles Client et Fournisseur acceptent oui/non.' : 'Pour créer un contact, associez son nom ou prénom. Le nom complet Odoo est conservé dans le champ Nom. Importez les sociétés avant leurs personnes.'}</p>
    <HDialog open={save} onOpenChange={setSave} title="Mémoriser le mapping" description="Ce profil est personnel. Il sera proposé pour les fichiers de même structure."><form className="dialog-form" onSubmit={(e) => { e.preventDefault(); void saveProfile() }}><label>Nom du profil<HInput required aria-label="Nom du profil d’import" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Répertoire commercial CSV" /></label>{error && <p role="alert">{error}</p>}<HDialogFooter><HButton disabled={busy} onClick={() => setSave(false)}>Annuler</HButton><HSaveButton hasChanges={Boolean(name.trim())} pending={busy} /></HDialogFooter></form></HDialog>
  </section>
}
