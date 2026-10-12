import { useEffect, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../core/auth/services/session'
import { UserAvatar } from '../../core/auth/components/UserAvatar'
import { activityService } from '../../core/activity/services/ActivityService'
import type { ActivityEvent, ActivitySource } from '../../core/activity/types/activity'
export function ActivityAvatar({ item, source }: { item: ActivityEvent; source: ActivitySource }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const own = session.status === 'authenticated' && session.user.id === item.author
  const photo = useQuery({ queryKey: ['activity', 'avatar', source.entity, source.id, item.author, session.status === 'authenticated' ? session.user.accessRevision : ''], queryFn: () => activityService.avatar(item.id, source), enabled: Boolean(item.author) && !own, staleTime: 60000, retry: false })
  if (own && session.status === 'authenticated') return <UserAvatar user={session.user} showPresence={false} />
  return photo.data ? <BlobAvatar key={photo.dataUpdatedAt} blob={photo.data} initials={item.metadata.author.initials} /> : <span title={photo.error ? 'Photo indisponible' : undefined}>{item.metadata.author.initials}</span>
}
function BlobAvatar({ blob, initials }: { blob: Blob; initials: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => { const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') setUrl(reader.result) }; reader.readAsDataURL(blob); return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() } }, [blob])
  return url ? <img src={url} alt="" /> : initials
}
