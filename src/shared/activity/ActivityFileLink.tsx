import { useState, type ReactNode } from 'react'
import { Eye, FileText } from 'lucide-react'
import { activityFilename, useActivityAttachment } from './useActivityAttachment'
import { HButton } from '../ui/HButton'
import { HFilePreview } from '../ui/HFilePreview'
import { HFileThumbnail } from '../ui/HFileThumbnail'
export function ActivityFileLink({ eventId, file, collectionId = 'core_activity_events', preview = false, compact = false, thumbnail = false, previewIcon = false, renderTrigger }: { eventId: string; file: string; collectionId?: string; preview?: boolean; compact?: boolean; thumbnail?: boolean; previewIcon?: boolean; renderTrigger?: (open: () => void, disabled: boolean) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const link = useActivityAttachment(eventId, file, collectionId)
  const name = activityFilename(file)
  if (thumbnail) return link.data ? <HFileThumbnail source={link.data} name={name} pdf={/\.pdf$/i.test(file)} previewIcon={previewIcon} /> : <span role={link.error ? 'alert' : undefined}>{link.error ? 'Fichier indisponible' : 'Chargement de la pièce…'}</span>
  if (preview) return <>{renderTrigger ? renderTrigger(() => setOpen(true), !link.data) : <HButton variant="ghost" size={compact ? 'icon' : 'small'} className={compact ? undefined : 'activity-file'} aria-label={`Aperçu ${name}`} title={`Aperçu ${name}`} disabled={!link.data} onClick={() => setOpen(true)}><Eye size={15} />{!compact && <><strong>{name}</strong><small>Aperçu</small></>}</HButton>}{link.error && <span role="alert">Fichier indisponible</span>}{open && link.data && <HFilePreview name={name} url={link.data} pdf={/\.pdf$/i.test(file)} onClose={() => setOpen(false)} />}</>
  return link.data ? <a href={link.data} target="_blank" rel="noreferrer" className="activity-file"><span><FileText size={17} /></span><strong>{name}</strong><small>Ouvrir</small></a> : <span className="activity-file">{name}{link.error && <span role="alert"> — Fichier indisponible</span>}</span>
}
