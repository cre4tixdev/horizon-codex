import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { activityService } from '../../core/activity/services/ActivityService'
function activityFilename(value: string) { return value.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1') }
export function ActivityFileLink({ eventId, file, collectionId = 'core_activity_events' }: { eventId: string; file: string; collectionId?: string }) {
  const link = useQuery({ queryKey: ['activity-file', eventId, file], queryFn: () => activityService.attachmentURL(collectionId, eventId, file), staleTime: 60_000, retry: false })
  return link.data ? <a href={link.data} target="_blank" rel="noreferrer" className="activity-file"><span><FileText size={17} /></span><strong>{activityFilename(file)}</strong><small>Ouvrir</small></a> : <span className="activity-file">{activityFilename(file)}{link.error && <span role="alert"> — Fichier indisponible</span>}</span>
}
