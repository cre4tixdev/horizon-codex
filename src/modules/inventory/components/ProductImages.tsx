import { useEffect, useId, useState } from 'react'
import { Package, Camera, X } from 'lucide-react'
import { ImageSearch } from '../../../shared/images/ImageSearch'
import { HButton } from '../../../shared/ui/HButton'
import type { Product, ProductFiles } from '../schemas/catalog'
function usePreview(file?: File) {
  const [preview, setPreview] = useState('')
  useEffect(() => { if (!file) return; const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') setPreview(reader.result) }; reader.readAsDataURL(file); return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() } }, [file])
  return file ? preview : ''
}
export function ProductImages({ query, record, files, onChange, disabled }: { query: string; record?: Product | undefined; files: ProductFiles; onChange: (value: ProductFiles) => void; disabled: boolean }) {
  const id = useId(), preview = usePreview(files.primary)
  const src = files.primary ? preview : files.removePrimary ? '' : record?.image_url
  return <div className="catalog-photo"><label htmlFor={id} className="catalog-photo-target" title="Photo principale">{src ? <img src={src} alt={record?.name || 'Photo du produit'} /> : <Package size={38} />}{!disabled && <span><Camera size={14} /></span>}</label><input id={id} className="contact-photo-input" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Photo principale" disabled={disabled} onChange={(event) => onChange({ ...files, primary: event.target.files?.[0], removePrimary: false })} />
    {!disabled && <div className="catalog-photo-actions"><label htmlFor={id} title="Importer une photo">Importer</label><ImageSearch inputId={id} initialQuery={query} disabled={disabled} onChoose={(primary) => onChange({ ...files, primary, removePrimary: false })} />{(src || files.removePrimary) && <HButton type="button" size="icon" variant="ghost" aria-label="Retirer la photo principale" onClick={() => onChange({ ...files, primary: undefined, removePrimary: !files.removePrimary })}><X size={12} /></HButton>}</div>}
  </div>
}
