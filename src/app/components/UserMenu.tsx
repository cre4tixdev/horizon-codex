import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { accountService } from '../../core/auth/services/AccountService'
import { presenceLabels, type Presence } from '../../core/auth/schemas/account'
import { PresenceDot } from '../../core/auth/components/PresenceDot'
import { UserAvatar } from '../../core/auth/components/UserAvatar'
import { useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { DropdownMenu } from 'radix-ui'
import { Check, ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { hasPermission } from '../../core/auth/types/session'
import { sessionService } from '../../core/auth/services/session'
import { HButton } from '../../shared/ui/HButton'

export function UserMenu() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const name = user?.name || user?.email || 'CVS Engineering'
  const client = useQueryClient(), [presenceError, setPresenceError] = useState('')
  const presence = useMutation({ mutationFn: (value: Presence) => accountService.presence(value), onSuccess: (saved) => { setPresenceError(''); client.setQueryData(['account', 'profile', saved.id], saved) }, onError: (error) => setPresenceError(error.message) })
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <HButton variant="ghost" className="user-menu-trigger" aria-label="Menu utilisateur">
        <span aria-hidden="true">{user ? <UserAvatar user={user} /> : <span className="user-avatar">{initials}</span>}</span>
        <span className="user-menu-identity"><strong>{name}</strong><small>{user?.role.label || 'Espace interne'}</small></span>
        <ChevronDown size={14} aria-hidden="true" />
      </HButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="user-menu-content" align="end" sideOffset={8} collisionPadding={12}>
        <DropdownMenu.Label className="user-menu-label"><strong>{name}</strong>{user && <small>{user.email}</small>}</DropdownMenu.Label>
        {user && <><DropdownMenu.Label className="user-menu-label">Disponibilité</DropdownMenu.Label><DropdownMenu.RadioGroup className="user-menu-presence-options" value={user.presence || 'available'} onValueChange={(value) => { if (value === 'available' || value === 'away' || value === 'busy' || value === 'offline') presence.mutate(value) }}>{Object.entries(presenceLabels).map(([value, label]) => <DropdownMenu.RadioItem key={value} value={value} aria-label={label} disabled={presence.isPending}><PresenceDot presence={value as Presence} />{label}<DropdownMenu.ItemIndicator><Check size={13} /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}</DropdownMenu.RadioGroup>{presenceError && <p role="alert" className="field-error">{presenceError}</p>}</>}<DropdownMenu.Separator className="user-menu-separator" />
        {user && <DropdownMenu.Item asChild><Link to="/account"><UserRound size={16} />Mon compte</Link></DropdownMenu.Item>}
        {(!user || hasPermission(user, 'settings.references')) && <DropdownMenu.Item asChild><Link to="/settings"><Settings size={16} />Paramètres</Link></DropdownMenu.Item>}
        {user && <><DropdownMenu.Separator className="user-menu-separator" /><DropdownMenu.Item className="user-menu-signout" onSelect={() => sessionService.signOut()}><LogOut size={16} />Se déconnecter</DropdownMenu.Item></>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
}
