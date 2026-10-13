import { useQuery } from '@tanstack/react-query'
import { activityService } from '../../core/activity/services/ActivityService'
export function activityFilename(value: string) { return value.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1') }
export function useActivityAttachment(eventId: string, file: string, collectionId = 'core_activity_events') {
  return useQuery({ queryKey: ['activity-file', eventId, file], queryFn: () => activityService.attachmentURL(collectionId, eventId, file), enabled: Boolean(eventId && file), staleTime: 60_000, retry: false })
}
