import { useId, useState } from 'react'
import { Camera, X, UserRound } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { useImagePreview } from '../../../shared/images/useImagePreview'
import { EmployeeAvatar } from './EmployeeAvatar'
import type { Employee } from '../schemas/employees'

export function EmployeePhotoEditor({ record, file, removed, disabled, writable, onChange }: { record?: Employee | undefined; file?: File | undefined; removed: boolean; disabled: boolean; writable: boolean; onChange: (file: File | undefined, removed: boolean) => void }) {
  const id = useId()
  const preview = useImagePreview(file)
  const [error, setError] = useState('')
  const hasPhoto = Boolean(file || record?.avatar && !removed)
  return <div className="account-photo-editor employee-photo-editor">
    <div className="account-photo">{preview ? <img src={preview} alt="Aperçu de la photo de l’employé" /> : record ? <EmployeeAvatar employee={{ ...record, avatar: removed || file ? '' : record.avatar }} /> : <UserRound size={36} aria-label="Aucune photo" />}</div>
    <div className="employee-photo-details"><strong>Photo de l’employé</strong>
      {writable && <div className="account-photo-actions"><HButton variant="ghost" size="small" disabled={disabled} onClick={() => document.getElementById(id)?.click()}><Camera size={14} />{hasPhoto ? 'Remplacer la photo' : 'Ajouter une photo'}</HButton>{hasPhoto && <HButton variant="ghost" size="icon" disabled={disabled} aria-label="Retirer la photo de l’employé" onClick={() => { setError(''); onChange(undefined, Boolean(record?.avatar)) }}><X size={14} /></HButton>}</div>}
      <input id={id} className="contact-photo-input" type="file" aria-label="Photo de l’employé" accept="image/png,image/jpeg,image/webp" disabled={disabled || !writable} onChange={(event) => {
        const selected = event.target.files?.[0]; event.target.value = ''
        if (!selected) return
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 2097152) { setError('Photo PNG, JPEG ou WebP de 2 Mio maximum.'); return }
        setError(''); onChange(selected, false)
      }} />
      <p className="contact-muted">{file ? file.name : removed ? 'La photo sera retirée à l’enregistrement.' : 'PNG, JPEG ou WebP · 2 Mio max.'}</p>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  </div>
}
