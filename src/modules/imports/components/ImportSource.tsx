import type { ColumnDef } from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileSpreadsheet, Plug, Upload, Settings2 } from 'lucide-react'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { collectOdoo } from '../services/odoo'
import { ImportImage } from './ImportImage'
import { importsService } from '../services/ImportsService'
import { readImportFile, sheetSource, type ImportSheet } from '../services/files'
import { suggestMapping, type ImportType, type SourceData } from '../schemas/imports'

export function ImportSource({ owner, type, value, kind, onKind, onChange, onBusy }: { onBusy: (busy: boolean) => void; owner: string; type: ImportType; kind: 'file' | 'odoo'; onKind: (kind: 'file' | 'odoo') => void; value: SourceData | null; onChange: (value: SourceData | null) => void }) {
  const [file, setFile] = useState<File | null>(null), [sheets, setSheets] = useState<ImportSheet[]>([]), [sheet, setSheet] = useState(''), [header, setHeader] = useState(1), [encoding, setEncoding] = useState('utf-8'), [separator, setSeparator] = useState('auto')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [configure, setConfigure] = useState(false), [url, setUrl] = useState('https://cvs-sas.odoo.com'), [database, setDatabase] = useState(''), [apiKey, setApiKey] = useState('')
  const [query, setQuery] = useState(''), [since, setSince] = useState(''), [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null)
  const updateBusy = (value: boolean) => { setBusy(value); onBusy(value) }
  const generation = useRef(0)
  useEffect(() => () => { generation.current++ }, [])
  const odoo = useQuery({ queryKey: ['imports-odoo', owner], queryFn: () => importsService.odoo(), enabled: kind === 'odoo', retry: false })
  const prepare = (entries: ImportSheet[], name: string, line: number, filename: string) => { const selected = entries.find((s) => s.name === name); if (!selected) return; onChange(sheetSource(selected, line, filename)) }
  const load = async (next: File, code = encoding, delimiter = separator) => {
    const request = ++generation.current; setFile(next); updateBusy(true); setError(''); onChange(null)
    try { const entries = await readImportFile(next, code, delimiter === 'auto' ? undefined : delimiter); if (request !== generation.current) return; setSheets(entries); setSheet(entries[0]?.name || ''); setHeader(1); prepare(entries, entries[0]?.name || '', 1, next.name) }
    catch (e) { if (request === generation.current) setError(e instanceof TypeError ? 'Encodage illisible. Essayez Windows-1252 pour un CSV exporté depuis Excel.' : e instanceof Error ? e.message : 'Fichier illisible.') }
    finally { if (request === generation.current) updateBusy(false) }
  }
  const readOdoo = async () => {
    const request = ++generation.current
    updateBusy(true); setError(''); onChange(null); setProgress(null)
    try {
      const data = await collectOdoo((after_id) => importsService.readOdoo({ type, after_id, query, since }), (loaded, total) => { if (request === generation.current) setProgress({ loaded, total }) })
      if (request !== generation.current) return
      if (!data.rows.length) { setError('Aucun résultat pour cette sélection.'); return }
      onChange({ ...data, filename: `Odoo · ${type === 'companies' ? 'Sociétés' : 'Personnes'}` })
    } catch (e) { if (request === generation.current) { setProgress(null); setError(e instanceof Error ? e.message : 'Lecture impossible.') } }
    finally { if (request === generation.current) updateBusy(false) }
  }
  const saveOdoo = async () => {
    updateBusy(true); setError('')
    try { const data = await importsService.saveOdoo({ base_url: url.replace(/\/$/, ''), database, api_key: apiKey }); await odoo.refetch(); setUrl(data.base_url); setDatabase(data.database); setApiKey(''); setConfigure(false) }
    catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.') } finally { updateBusy(false) }
  }
  const imageIndex = value ? suggestMapping(type, value.headers).image_base64 : undefined
  const displayColumns = value?.headers.map((header, index) => ({ header, index })) || []
  if (imageIndex !== undefined) { const [image] = displayColumns.splice(imageIndex, 1); if (image) displayColumns.splice(Math.min(2, displayColumns.length), 0, image) }
  return <>
    <HRecordTabs label="Source de l’import" idPrefix="import-source" value={kind} onChange={(v) => { if (busy) return; generation.current++; onKind(v === 'odoo' ? 'odoo' : 'file'); onChange(null); setError(''); setProgress(null) }} items={[{ value: 'file', label: 'Excel / CSV', icon: FileSpreadsheet, panel: 'import-file' }, { value: 'odoo', label: 'API Odoo', icon: Plug, panel: 'import-odoo' }]} />
    <section className="contact-panel import-source-panel" id={kind === 'file' ? 'import-file' : 'import-odoo'}>
      {kind === 'file' ? <>
        <HSectionHeading title="Choisir un fichier" description="CSV ou Excel .xlsx · 10 Mio · 1 000 lignes maximum par import." />
        <label className="import-upload" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!busy && e.dataTransfer.files[0]) void load(e.dataTransfer.files[0]) }}><Upload size={24} aria-hidden="true" /><strong>{file?.name || 'Glissez un fichier ou cliquez pour le parcourir'}</strong><span>Les cellules vides ne remplacent jamais les valeurs existantes.</span><input type="file" aria-label="Fichier Excel ou CSV" accept=".csv,.xlsx" disabled={busy} onChange={(e) => { if (e.target.files?.[0]) void load(e.target.files[0]); e.target.value = '' }} /></label>
        {file && <div className="import-controls">
          {sheets.length > 1 && <label>Feuille Excel<HCombobox label="Feuille Excel" value={sheet} showCodes={false} required clearable={false} options={sheets.map((s) => ({ value: s.name, label: s.name }))} onChange={(name) => { setSheet(name); try { prepare(sheets, name, header, file.name); setError('') } catch (e) { onChange(null); setError(e instanceof Error ? e.message : 'Feuille invalide.') } }} /></label>}
          <label>Ligne d’en-tête<HInput aria-label="Ligne d’en-tête" type="number" min={1} max={50} value={header} onChange={(e) => { const line = Number(e.target.value); setHeader(line); try { prepare(sheets, sheet, line, file.name); setError('') } catch (e) { onChange(null); setError(e instanceof Error ? e.message : 'En-tête invalide.') } }} /></label>
          {/\.csv$/i.test(file.name) && <><label>Encodage<HCombobox label="Encodage CSV" value={encoding} showCodes={false} required clearable={false} options={[{ value: 'utf-8', label: 'UTF-8' }, { value: 'windows-1252', label: 'Windows-1252 (Excel)' }]} onChange={(v) => { setEncoding(v); void load(file, v) }} /></label><label>Séparateur<HCombobox label="Séparateur CSV" value={separator} showCodes={false} required clearable={false} options={[{ value: 'auto', label: 'Détection automatique' }, { value: ';', label: 'Point-virgule ;' }, { value: ',', label: 'Virgule ,' }, { value: '\t', label: 'Tabulation' }]} onChange={(v) => { setSeparator(v); void load(file, encoding, v) }} /></label></>}
        </div>}
      </> : <>
        <HSectionHeading title="Lire les partenaires Odoo" description="Import en lecture seule : aucune modification dans Odoo." actions={odoo.data?.can_configure && <HButton size="small" onClick={() => { setUrl(odoo.data.base_url || 'https://cvs-sas.odoo.com'); setDatabase(odoo.data.database); setConfigure(true) }}><Settings2 size={14} />{odoo.data.configured ? 'Connexion Odoo' : 'Configurer Odoo'}</HButton>} />
        {odoo.isPending && <p role="status">Vérification de la connexion…</p>}{odoo.error && <p role="alert">{odoo.error.message}</p>}
        {odoo.data && !odoo.data.configured && <p className="contact-muted">La connexion doit être configurée par un administrateur avant de lire les données.</p>}
        {odoo.data?.configured && <><p className="contact-muted">{odoo.data.base_url}</p><div className="import-controls"><label>Nom à rechercher<HInput aria-label="Nom à rechercher dans Odoo" value={query} disabled={busy} onChange={(e) => { setQuery(e.target.value); onChange(null); setProgress(null) }} placeholder="Toutes les sociétés / personnes" /></label><label>Modifié depuis<HInput type="date" aria-label="Modifié depuis" value={since} disabled={busy} onChange={(e) => { setSince(e.target.value); onChange(null); setProgress(null) }} /></label><HButton disabled={busy} onClick={() => void readOdoo()}><Plug size={14} />Charger toute la sélection</HButton></div></>}
        {progress && <p role="status">{progress.loaded.toLocaleString('fr-FR')} / {progress.total.toLocaleString('fr-FR')} {type === 'companies' ? 'sociétés chargées' : 'contacts chargés'}{busy ? '…' : ' · Sélection complète'}</p>}
      </>}
      {kind === 'odoo' && value && <div className="import-source-images" role="status">
        <p><strong>Images Odoo : {value.imageInfo?.received || 0} reçue(s) sur {value.rows.length} fiche(s).</strong></p>
        {!value.imageInfo?.fields ? <p>Le serveur ne fournit pas encore le diagnostic des images. Installez le dernier pack PocketBase puis relisez Odoo.</p> : !value.imageInfo.fields.length ? <p>Aucun champ de photo ou logo accessible dans cette connexion Odoo.</p> : !value.imageInfo.received ? <p>Odoo ne renvoie aucune photo pour cette sélection. Les initiales et avatars générés automatiquement par Odoo ne sont pas des photos enregistrées.</p> : value.imageInfo.valid < value.imageInfo.received ? <p>{value.imageInfo.received - value.imageInfo.valid} image(s) reçue(s) dans un format non reconnu : vérifiez les lignes avant import.</p> : <p>Les images reçues sont reconnues pour l’aperçu et l’import.</p>}
        {value.imageInfo?.fields && value.imageInfo.fields.length > 0 && <p className="contact-muted">Champs vérifiés : {value.imageInfo.fields.join(', ')}.</p>}
      </div>}
      {busy && !progress && <p role="status">Lecture en cours…</p>}{error && <p role="alert" className="contact-error">{error}</p>}
    </section>
    {value && <section className="contact-panel"><HSectionHeading title={kind === 'odoo' ? 'Aperçu de la sélection Odoo complète' : 'Aperçu du fichier source'} count={value.rows.length} description="Les cinq premières lignes. La correspondance des champs se règle à l’étape suivante." /><HDataTable columnBorders data={value.rows.slice(0, 5)} columnWidths={imageIndex === undefined ? {} : { [String(imageIndex)]: 52 }} columnAlignments={imageIndex === undefined ? {} : { [String(imageIndex)]: 'center' }} columns={displayColumns.map<ColumnDef<string[]>>(({ header, index }) => ({ id: String(index), header: index === imageIndex ? 'Image' : header, cell: ({ row }) => index === imageIndex ? <ImportImage compact value={row.original[index] || ''} /> : <span className="import-cell" title={row.original[index]}>{row.original[index] || '—'}</span> }))} /></section>}
    <HDialog open={configure} onOpenChange={(open) => { if (!busy) { setConfigure(open); if (!open) setApiKey('') } }} title="Connexion Odoo" description="Clé API conservée chiffrée sur le serveur. Aucune écriture dans Odoo."><form className="dialog-form" onSubmit={(e) => { e.preventDefault(); void saveOdoo() }}><label>Adresse de l’instance<HInput required aria-label="Adresse de l’instance Odoo" value={url} onChange={(e) => setUrl(e.target.value)} /></label><label>Base (si nécessaire)<HInput aria-label="Base Odoo" value={database} onChange={(e) => setDatabase(e.target.value)} /></label><label>Clé API<HInput type="password" autoComplete="new-password" aria-label="Clé API Odoo" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={odoo.data?.configured ? 'Laisser vide pour conserver la clé' : 'Clé du compte autorisé à lire les contacts'} /></label>{error && <p role="alert">{error}</p>}<HDialogFooter><HButton disabled={busy} onClick={() => { setConfigure(false); setApiKey('') }}>Annuler</HButton><HSaveButton hasChanges pending={busy}>Vérifier et enregistrer</HSaveButton></HDialogFooter></form></HDialog>
  </>
}
