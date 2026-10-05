import { useEffect, useRef, useState } from 'react'
import { Search, Check, Image, Upload } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { logoSearchService } from '../services/LogoSearchService'
import type { LogoFormat, LogoSearchResult } from '../types/logoSearch'

export function LogoSearch({ initialQuery, disabled, onChoose, inputId }: { initialQuery: string; disabled: boolean; onChoose: (file: File) => void; inputId: string }) {
  const [open, setOpen] = useState(false)
  return <HDialog open={open} onOpenChange={setOpen} title="Rechercher un logo" description="Choisissez une image, puis validez pour l’ajouter à la fiche."
    trigger={<HButton variant="ghost" size="icon" className="contact-logo-search-trigger" disabled={disabled} aria-label="Rechercher un logo"><Search size={14} /></HButton>}>
    {open && <LogoSearchContent initialQuery={initialQuery} onChoose={(file) => { onChoose(file); setOpen(false) }} onCancel={() => setOpen(false)} inputId={inputId} />}
  </HDialog>
}
function LogoSearchContent({ initialQuery, onChoose, onCancel, inputId }: { initialQuery: string; onChoose: (file: File) => void; onCancel: () => void; inputId: string }) {
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const [query, setQuery] = useState(initialQuery ? `${initialQuery} logo` : '')
  const [format, setFormat] = useState<LogoFormat>('all')
  const [results, setResults] = useState<LogoSearchResult[]>([])
  const [selected, setSelected] = useState<LogoSearchResult>()
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function search() {
    setBusy(true); setError(''); setSelected(undefined)
    try { setResults(await logoSearchService.search(query, format)); setSearched(true) }
    catch (error) { setResults([]); setError(error instanceof Error ? error.message : 'Recherche indisponible.') }
    finally { setBusy(false) }
  }
  async function choose() {
    if (!selected) return
    setBusy(true); setError('')
    try { const file = await logoSearchService.download(selected); if (active.current) onChoose(file) }
    catch (error) { setError(error instanceof Error ? error.message : 'Téléchargement impossible.') }
    finally { setBusy(false) }
  }
  return <div className="logo-search">
    <div className="logo-search-toolbar"><HInput aria-label="Mots-clés du logo" value={query} disabled={busy} placeholder="Nom de société, marque…" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }} /><HCombobox required showCodes={false} label="Format d’image" value={format} options={[{ value: 'all', label: 'Tous formats' }, { value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }]} disabled={busy} onChange={(value) => { if (value !== 'all' && value !== 'png' && value !== 'jpeg' && value !== 'webp') return; setFormat(value); setSelected(undefined); setResults([]); setSearched(false) }} /><HButton disabled={busy || query.trim().length < 2} onClick={() => void search()}><Search size={15} />Rechercher</HButton></div>
    {error && <p role="alert" className="logo-search-error">{error}</p>}
    <div className="logo-search-results" aria-busy={busy}>{results.length ? <div className="logo-search-grid">{results.map((image) => <button key={image.id} type="button" className={`logo-search-result${selected?.id === image.id ? ' logo-search-result--selected' : ''}`} disabled={busy} aria-label={`Choisir ${image.title}`} aria-pressed={selected?.id === image.id} onClick={() => setSelected(image)}><img crossOrigin="anonymous" src={image.imageUrl} alt={image.title} loading="lazy" referrerPolicy="no-referrer" /><span>{image.title}</span>{selected?.id === image.id && <Check size={15} />}</button>)}</div> : <div className="logo-search-empty"><Image size={30} /><p>{busy ? 'Recherche en cours…' : searched ? 'Aucune image trouvée. Essayez d’autres mots-clés ou un autre format.' : 'Recherchez un nom ou une marque pour voir les images disponibles.'}</p></div>}</div>
    {selected && <div className="logo-search-selection"><img crossOrigin="anonymous" referrerPolicy="no-referrer" src={selected.imageUrl} alt="Aperçu du logo sélectionné" /><div><strong>{selected.title}</strong><small>{selected.width} × {selected.height} · {selected.mime.replace('image/', '').toUpperCase()}</small><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Voir la source et les conditions d’utilisation</a></div></div>}
    <div className="logo-search-footer"><small>Wikimedia Commons</small><label htmlFor={inputId} className="logo-search-upload" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById(inputId)?.click(); onCancel() } }} onClick={onCancel}><Upload size={14} />Importer un fichier</label><HButton disabled={busy} onClick={onCancel}>Annuler</HButton><HButton variant="primary" disabled={busy || !selected} onClick={() => void choose()}>Utiliser ce logo</HButton></div>
  </div>
}
