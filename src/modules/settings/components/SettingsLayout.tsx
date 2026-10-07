import { NavLink, Outlet } from 'react-router'
import { useSyncExternalStore } from 'react'
import { LayoutGrid, ShieldCheck } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { settingsGroups, settingsSections, settingsSectionPath } from '../navigation'
export function SettingsLayout() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  if (session.status === 'authenticated' && !hasPermission(session.user, 'settings.references')) return <HEmptyState icon={ShieldCheck} title="Paramètres" description="Le paramétrage est réservé à Admin et Superuser." />
  return <div className="settings-page"><HPageHeader title="Paramètres" description="Configurez votre organisation, vos référentiels et vos modules." /><div className="settings-shell">
    <nav className="settings-navigation" aria-label="Navigation des paramètres"><NavLink to="/settings" end><LayoutGrid size={16} /><span>Vue d’ensemble</span></NavLink>{settingsGroups.map((group) => <div className="settings-navigation-group" key={group}><p>{group}</p>{settingsSections.filter((section) => section.group === group).map(({ slug, title, icon: Icon }) => <NavLink key={slug} to={settingsSectionPath(slug)}><Icon size={16} /><span>{title}</span></NavLink>)}</div>)}</nav>
    <div className="settings-main"><Outlet /></div>
  </div></div>
}
