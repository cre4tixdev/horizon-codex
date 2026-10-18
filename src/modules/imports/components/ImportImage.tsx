import { ImageOff } from 'lucide-react'
import { HFileThumbnail } from '../../../shared/ui/HFileThumbnail'
import { importImageSource } from '../services/image'
export function ImportImage({ value, compact = false }: { value: string; compact?: boolean }) {
  const source = importImageSource(value)
  return source ? <span className={compact ? 'import-image-compact' : undefined}><HFileThumbnail source={source} name="Image à importer" pdf={false} previewIcon /></span> : compact ? <span title={value ? 'Image base64 invalide' : 'Aucune image à importer'}>{value ? <ImageOff size={14} aria-label="Image base64 invalide" /> : '—'}</span> : <span>{value ? 'Image base64 invalide' : 'Aucune image à importer'}</span>
}
