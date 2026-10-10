import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, FileText } from 'lucide-react'
import { activityService } from '../../core/activity/services/ActivityService'
import { HButton } from '../ui/HButton'
import { HDialog } from '../ui/HDialog'
function activityFilename(value: string) { return value.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1') }
export function ActivityFileLink({ eventId, file, collectionId = 'core_activity_events', preview = false, compact = false }: { eventId: string; file: string; collectionId?: string; preview?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const link = useQuery({ queryKey: ['activity-file', eventId, file], queryFn: () => activityService.attachmentURL(collectionId, eventId, file), staleTime: 60_000, retry: false })
  const name = activityFilename(file)
  if (preview) return <><HButton variant="ghost" size={compact ? 'icon' : 'small'} className={compact ? undefined : 'activity-file'} aria-label={`Aperçu ${name}`} title={`Aperçu ${name}`} disabled={!link.data} onClick={() => setOpen(true)}><Eye size={15} />{!compact && <><strong>{name}</strong><small>Aperçu</small></>}</HButton>{link.error && <span role="alert">Fichier indisponible</span>}{open && link.data && <HDialog open title={name} description="Document de commande client" className="activity-file-preview" onOpenChange={setOpen}>{/\.pdf$/i.test(file) ? <iframe title={`Aperçu ${name}`} src={link.data} /> : <img alt={name} src={link.data} />}</HDialog>}</>
  return link.data ? <a href={link.data} target="_blank" rel="noreferrer" className="activity-file"><span><FileText size={17} /></span><strong>{name}</strong><small>Ouvrir</small></a> : <span className="activity-file">{name}{link.error && <span role="alert"> — Fichier indisponible</span>}</span>
}
