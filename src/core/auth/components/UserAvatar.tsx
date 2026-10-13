import { useImagePreview } from '../../../shared/images/useImagePreview'
import { PresenceDot } from './PresenceDot'
import { useQuery } from '@tanstack/react-query'
import { accountService } from '../services/AccountService'
export function UserAvatar({ user, className = '', showPresence = true }: { user: { id: string; name: string; avatar?: string; presence?: 'available' | 'away' | 'busy' | 'offline' }; className?: string; showPresence?: boolean }) {
  const photo = useQuery({ queryKey: ['account', 'avatar', user.id, user.avatar], queryFn: () => accountService.avatar(user.id), enabled: Boolean(user.id), staleTime: 60000, retry: false })
  const url = useImagePreview(photo.data)
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`user-avatar ${className}`} title={photo.error ? 'Photo indisponible' : undefined}>{url ? <img src={url} alt={`Photo de ${user.name}`} referrerPolicy="no-referrer" /> : initials}{showPresence && <PresenceDot presence={user.presence || 'available'} />}</span>
}
