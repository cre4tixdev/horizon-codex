import { useEffect, useId, useState } from 'react'
import { Building2, Camera, UserRound, X } from 'lucide-react'
import { LogoSearch } from './LogoSearch'
import { GalleryImage } from './ContactIdentity'
import type { Company, ContactFiles, Person } from '../types/contacts'

export function ContactImageEditor({ kind, record, files, onChange, disabled, searchQuery = '' }: { searchQuery?: string; kind: 'companies' | 'people'; record?: Company | Person | undefined; files: ContactFiles; onChange: (files: ContactFiles) => void; disabled: boolean }) {
  const id = useId()
  const [preview, setPreview] = useState('')
  useEffect(() => { if (!files.image) return; const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') setPreview(reader.result) }; reader.readAsDataURL(files.image); return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() } }, [files.image])
  const label = kind === 'companies' ? 'Logo' : 'Avatar'
  const filename = record ? 'logo' in record ? record.logo : record.avatar : ''
  return <div className={`contact-photo-control contact-photo-control--${kind}`}>
    <label htmlFor={id} className="contact-photo-target" title={disabled ? label : `Choisir ${label.toLowerCase()}`}>
      <span className="contact-image-preview" aria-label={`Aperçu ${label.toLowerCase()}`}>{files.image && preview ? <img src={preview} alt={`Aperçu du nouvel ${label.toLowerCase()}`} /> : filename && !files.removeImage && record ? <GalleryImage company={{ collectionId: record.collectionId, id: record.id }} filename={filename} /> : kind === 'companies' ? <Building2 size={30} /> : <UserRound size={30} />}</span>
      {!disabled && kind === 'people' && <span className="contact-photo-camera"><Camera size={13} /></span>}
    </label>
    <input id={id} className="contact-photo-input" aria-label={label} disabled={disabled} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onChange({ ...files, image: event.target.files?.[0], removeImage: false })} />
    {!disabled && (kind === 'companies' ? <div className="contact-logo-actions">
      <label htmlFor={id} className="contact-photo-caption">Charger</label>
      <LogoSearch initialQuery={searchQuery} disabled={disabled} inputId={id} onChoose={(image) => onChange({ ...files, image, removeImage: false })} />
    </div> : <label htmlFor={id} className="contact-photo-caption">{filename || files.image ? 'Changer' : 'Ajouter'} {label.toLowerCase()}</label>)}
    {filename && !disabled && <button type="button" className="contact-photo-remove" aria-label={files.removeImage ? 'Conserver l’image actuelle' : 'Retirer l’image actuelle'} title={files.removeImage ? 'Conserver l’image actuelle' : 'Retirer l’image actuelle'} onClick={() => onChange({ ...files, image: undefined, removeImage: !files.removeImage })}><X size={12} /></button>}
  </div>
}
