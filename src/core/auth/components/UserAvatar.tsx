import { PresenceDot } from './PresenceDot'
import { useQuery } from '@tanstack/react-query'
import { accountService } from '../services/AccountService'
export function UserAvatar({ user, className = '', showPresence = true }: { user: { id: string; name: string; avatar?: string; presence?: 'available' | 'away' | 'busy' | 'offline' }; className?: string; showPresence?: boolean }) {
  const photo = useQuery({ queryKey: ['account', 'avatar', user.id, user.avatar], queryFn: () => accountService.avatarURL({ id: user.id, avatar: user.avatar || '' }), enabled: Boolean(user.avatar), staleTime: 60000, retry: false })
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`user-avatar ${className}`} title={photo.error ? 'Photo indisponible' : undefined}>{photo.data ? <img src={photo.data} alt="" referrerPolicy="no-referrer" /> : initials}{showPresence && <PresenceDot presence={user.presence || 'available'} />}</span>
}
