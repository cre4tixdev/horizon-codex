import { useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { DropdownMenu } from 'radix-ui'
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { sessionService } from '../../core/auth/services/session'
import { HButton } from '../../shared/ui/HButton'

export function UserMenu() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const name = user?.name || user?.email || 'CVS Engineering'
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <HButton variant="ghost" className="user-menu-trigger" aria-label="Menu utilisateur">
        <span className="user-avatar" aria-hidden="true">{initials}</span>
        <span className="user-menu-identity"><strong>{name}</strong><small>{user?.role.label || 'Espace interne'}</small></span>
        <ChevronDown size={14} aria-hidden="true" />
      </HButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="user-menu-content" align="end" sideOffset={8} collisionPadding={12}>
        <DropdownMenu.Label className="user-menu-label"><strong>{name}</strong>{user && <small>{user.email}</small>}</DropdownMenu.Label>
        <DropdownMenu.Separator className="user-menu-separator" />
        {user && <DropdownMenu.Item asChild><Link to="/account"><UserRound size={16} />Mon compte</Link></DropdownMenu.Item>}
        <DropdownMenu.Item asChild><Link to="/settings"><Settings size={16} />Paramètres</Link></DropdownMenu.Item>
        {user && <><DropdownMenu.Separator className="user-menu-separator" /><DropdownMenu.Item className="user-menu-signout" onSelect={() => sessionService.signOut()}><LogOut size={16} />Se déconnecter</DropdownMenu.Item></>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
}
