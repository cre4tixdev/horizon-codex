import { useEffect, useId, useRef, useState } from 'react'
import { Search, Check, Image, Upload, ClipboardPaste, ExternalLink } from 'lucide-react'
import { HDialog } from '../ui/HDialog'
import { HButton } from '../ui/HButton'
import { HInput } from '../ui/HInput'
import { HCombobox } from '../ui/HCombobox'
import { imageSearchService } from '../../core/images/services/ImageSearchService'
import type { ImageFormat, ImageSearchResult } from '../../core/images/types/imageSearch'

export function ImageSearch({ initialQuery, disabled = false, onChoose, inputId, purpose = 'image' }: { initialQuery: string; disabled?: boolean; onChoose: (file: File) => void; inputId: string; purpose?: 'logo' | 'image' }) {
  const [open, setOpen] = useState(false)
  return <HDialog open={open} onOpenChange={setOpen} title={purpose === 'logo' ? 'Rechercher un logo' : 'Rechercher une image'} description="Choisissez une image, puis validez pour l’ajouter à la fiche."
    trigger={<HButton variant="ghost" size="icon" className="contact-logo-search-trigger" disabled={disabled} aria-label={purpose === 'logo' ? 'Rechercher un logo' : 'Rechercher une image'}><Search size={14} /></HButton>}>
    {open && <ImageSearchContent purpose={purpose} initialQuery={initialQuery} onChoose={(file) => { onChoose(file); setOpen(false) }} onCancel={() => setOpen(false)} inputId={inputId} />}
  </HDialog>
}
function ImageSearchContent({ initialQuery, onChoose, onCancel, inputId, purpose }: { initialQuery: string; onChoose: (file: File) => void; onCancel: () => void; inputId: string; purpose: 'logo' | 'image' }) {
  const id = useId()
  const [source, setSource] = useState<'wikimedia' | 'google'>('google')
  const pasteTarget = useRef<HTMLDivElement>(null)
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const [query, setQuery] = useState(initialQuery ? `${initialQuery}${purpose === 'logo' ? ' logo' : ''}` : '')
  const [format, setFormat] = useState<ImageFormat>('all')
  const [results, setResults] = useState<ImageSearchResult[]>([])
  const [selected, setSelected] = useState<ImageSearchResult>()
  const [pasted, setPasted] = useState<File>()
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!pasted) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setPreview(reader.result) }
    reader.readAsDataURL(pasted)
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [pasted])
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function search() {
    setBusy(true); setError(''); setSelected(undefined)
    try { setResults(await imageSearchService.search(query, format)); setSearched(true) }
    catch (error) { setResults([]); setError(error instanceof Error ? error.message : 'Recherche indisponible.') }
    finally { setBusy(false) }
  }
  async function choose() {
    if (pasted) { onChoose(pasted); return }
    if (!selected) return
    setBusy(true); setError('')
    try { const file = await imageSearchService.download(selected); if (active.current) onChoose(file) }
    catch (error) { setError(error instanceof Error ? error.message : 'Téléchargement impossible.') }
    finally { setBusy(false) }
  }
  async function paste(files: File[]) {
    if (busy) return
    if (!files.length) { setError('Copiez l’image elle-même (clic droit → Copier l’image), puis collez-la ici.'); return }
    if (files.length > 1) { setError('Collez une seule image à la fois.'); return }
    setBusy(true); setError('')
    try { const file = await imageSearchService.prepareClipboardImage(files[0]!); if (active.current) { setPreview(''); setPasted(file); setSelected(undefined); setSource('google') } }
    catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : 'Impossible de coller cette image.') }
    finally { if (active.current) setBusy(false) }
  }
  function changeSource(next: 'wikimedia' | 'google') {
    setSource(next); setSelected(undefined); setPasted(undefined); setError('')
  }
  function openGoogle() {
    setError('')
    try { pasteTarget.current?.focus(); window.open(imageSearchService.googleURL(query, format), '_blank', 'noopener,noreferrer,popup,width=1100,height=800') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Recherche indisponible.') }
  }
  return <div className="logo-search" onPaste={(event) => {
    const files = Array.from(event.clipboardData.files)
    if (files.length) { event.preventDefault(); void paste(files) }
    else if (source === 'google' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); void paste([]) }
  }}>
    <div className="image-search-sources" role="tablist" aria-label="Source des images">
      {([{ value: 'google', label: 'Google Images' }, { value: 'wikimedia', label: 'Wikimedia' }] as const).map((tab) => <button type="button" key={tab.value} id={`${id}-${tab.value}`} role="tab" aria-controls={`${id}-panel`} aria-selected={source === tab.value} tabIndex={source === tab.value ? 0 : -1} disabled={busy} onClick={() => changeSource(tab.value)} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'google' : event.key === 'End' ? 'wikimedia' : source === 'wikimedia' ? 'google' : 'wikimedia'
        changeSource(next); document.getElementById(`${id}-${next}`)?.focus()
      }}>{source === tab.value ? <Check size={14} /> : tab.value === 'google' ? <ExternalLink size={14} /> : <Image size={14} />}{tab.label}</button>)}
    </div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${source}`}>
      <p className="image-search-source-hint">{source === 'wikimedia' ? 'Recherchez puis sélectionnez une image dans les résultats.' : 'Trouvez une image dans Google, puis collez-la ici.'}</p>
      <div className="logo-search-toolbar"><HInput aria-label={purpose === 'logo' ? 'Mots-clés du logo' : 'Mots-clés de l’image'} value={query} disabled={busy} placeholder="Société, produit, référence, mots-clés…" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !busy) { event.preventDefault(); if (source === 'google') openGoogle(); else void search() } }} /><HCombobox required showCodes={false} label="Format d’image" value={format} options={[{ value: 'all', label: 'Tous formats' }, { value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }]} disabled={busy} onChange={(value) => { if (value !== 'all' && value !== 'png' && value !== 'jpeg' && value !== 'webp') return; setFormat(value); setSelected(undefined); setResults([]); setSearched(false) }} /><HButton disabled={busy || query.trim().length < 2} onClick={() => { if (source === 'google') openGoogle(); else void search() }}>{source === 'google' ? <ExternalLink size={15} /> : <Search size={15} />}{source === 'google' ? 'Ouvrir Google Images' : 'Rechercher'}</HButton></div>
      {source === 'google' ? <div className="image-search-google-flow">
        {!pasted && <div className="image-search-instructions"><div><span>1</span><p><strong>Recherchez dans Google</strong>La recherche s’ouvre dans une autre fenêtre.</p></div><div><span>2</span><p><strong>Copiez l’image choisie</strong>Clic droit sur l’image → Copier l’image.</p></div></div>}
        <div ref={pasteTarget} className={`image-search-paste${pasted ? ' image-search-paste--ready' : ''}`} role="group" aria-label="Coller une image" tabIndex={0} aria-busy={busy}>
          {pasted && preview ? <><img src={preview} alt="Aperçu de l’image collée" /><div><strong>Votre image est prête</strong><span>Validez en bas pour l’ajouter à la fiche.</span><HButton variant="ghost" size="small" disabled={busy} onClick={() => setPasted(undefined)}>Retirer l’image collée</HButton></div><Check size={20} /></> : <><ClipboardPaste size={28} /><div><strong>3. Collez votre image ici</strong><span>Cliquez dans cette zone puis faites <kbd>⌘ V</kbd> ou <kbd>Ctrl V</kbd></span><small>PNG, JPEG ou WebP · 2 Mio maximum</small></div></>}
        </div>
      </div> : <>
        <div className="logo-search-results" aria-busy={busy}>{results.length ? <div className="logo-search-grid">{results.map((image) => <button key={image.id} type="button" className={`logo-search-result${selected?.id === image.id ? ' logo-search-result--selected' : ''}`} disabled={busy} aria-label={`Choisir ${image.title}`} aria-pressed={selected?.id === image.id} onClick={() => { setSelected(image); setPasted(undefined) }}><img crossOrigin="anonymous" src={image.imageUrl} alt={image.title} loading="lazy" referrerPolicy="no-referrer" /><span>{image.title}</span>{selected?.id === image.id && <Check size={15} />}</button>)}</div> : <div className="logo-search-empty"><Image size={30} /><p>{busy ? 'Recherche en cours…' : searched ? 'Aucune image trouvée. Essayez d’autres mots-clés ou un autre format.' : 'Les résultats Wikimedia apparaîtront ici.'}</p></div>}</div>
        {selected && <div className="logo-search-selection"><img crossOrigin="anonymous" referrerPolicy="no-referrer" src={selected.imageUrl} alt={purpose === 'logo' ? 'Aperçu du logo sélectionné' : 'Aperçu de l’image sélectionnée'} /><div><strong>{selected.title}</strong><small>{selected.width} × {selected.height} · {selected.mime.replace('image/', '').toUpperCase()}</small><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Voir la source et les conditions d’utilisation</a></div></div>}
      </>}
      {error && <p role="alert" className="logo-search-error">{error}</p>}
    </div>
    <div className="logo-search-footer"><label htmlFor={inputId} className="logo-search-upload" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById(inputId)?.click(); onCancel() } }} onClick={onCancel}><Upload size={14} />Importer un fichier</label><HButton disabled={busy} onClick={onCancel}>Annuler</HButton><HButton variant="primary" disabled={busy || (!selected && !pasted)} onClick={() => void choose()}>{purpose === 'logo' ? 'Utiliser ce logo' : 'Utiliser cette image'}</HButton></div>
  </div>
}
