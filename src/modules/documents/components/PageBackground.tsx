import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { HColorField } from '../../../shared/ui/HColorField'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { OpacityControl } from './OpacityControl'
import { type Layout } from '../schemas/templates'
export function PageBackground({ value, onChange, onError }: { value: Layout['background']; onChange: (value: Layout['background']) => void; onError: (message: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null), background = value || { color: '#FFFFFF', image: '', opacity: 1, fit: 'contain' as const }
  return <div className="studio-page-background"><div className="studio-color-row"><HColorField label="Couleur du fond" value={background.color} onChange={(color) => onChange({ ...background, color })} /><HButton size="small" onClick={() => fileInput.current?.click()}><ImagePlus size={14} />{background.image ? 'Remplacer l’image' : 'Ajouter une image'}</HButton>{value && <HButton size="icon" variant="ghost" title="Retirer le fond de page" aria-label="Retirer le fond de page" onClick={() => onChange(undefined)}><X size={14} /></HButton>}</div>
    <input ref={fileInput} className="studio-file-input" type="file" aria-label="Image du fond de page" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
      if (file.size > 1000000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { onError('Choisissez une image PNG, JPEG ou WebP de moins de 1 Mo.'); return }
      const reader = new FileReader(); reader.onerror = () => onError('L’image n’a pas pu être lue.'); reader.onload = () => { if (typeof reader.result !== 'string') return; const image = new window.Image(), source = reader.result; image.onerror = () => onError('Cette image n’a pas pu être décodée.'); image.onload = () => onChange({ ...background, image: source }); image.src = source }; reader.readAsDataURL(file)
    }} />
    {background.image && <div className="studio-background-image"><img src={background.image} alt="Fond de page importé" /><HButton size="icon" variant="ghost" title="Retirer l’image de fond" aria-label="Retirer l’image de fond" onClick={() => onChange({ ...background, image: '' })}><X size={14} /></HButton><HCombobox label="Ajustement de l’image de fond" required clearable={false} showCodes={false} value={background.fit} options={[{ value: 'contain', label: 'Image entière' }, { value: 'cover', label: 'Remplir la page' }]} onChange={(fit) => { if (fit === 'contain' || fit === 'cover') onChange({ ...background, fit }) }} /></div>}
    <OpacityControl label="Opacité du fond de page" value={background.opacity} onChange={(opacity) => onChange({ ...background, opacity })} />
  </div>
}
