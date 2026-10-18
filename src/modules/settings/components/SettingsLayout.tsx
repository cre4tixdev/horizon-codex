import { NavLink, Outlet, Navigate, useLocation } from 'react-router'
import { useSyncExternalStore } from 'react'
import { LayoutGrid, ShieldCheck } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { settingsGroups, settingsSections, settingsSectionPath } from '../navigation'
export function SettingsLayout() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const { pathname } = useLocation()
  const general = session.status !== 'authenticated' || hasPermission(session.user, 'settings.references')
  const leave = session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'leave.read') && hasPermission(session.user, 'leave.settings')
  const time = session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'time.read') && hasPermission(session.user, 'time.settings')
  const sections = settingsSections.filter((section) => section.available && (general || leave && section.slug === 'leave' || time && section.slug === 'planning'))
  if (!general && time && !leave && pathname === '/settings') return <Navigate to="/settings/planning" replace />
  if (!general && leave && pathname === '/settings') return <Navigate to="/settings/leave" replace />
  if (!general && !(leave && pathname === '/settings/leave' || time && pathname === '/settings/planning')) return <HEmptyState icon={ShieldCheck} title="Paramètres" description="Le paramétrage est réservé à Admin et Superuser." />
  return <div className="settings-page"><HPageHeader title="Paramètres" description="Retrouvez les réglages métier, l’administration et vos préférences." /><div className="settings-shell">
    <nav className="settings-navigation" aria-label="Navigation des paramètres">{general && <NavLink to="/settings" end><LayoutGrid size={16} /><span>Vue d’ensemble</span></NavLink>}{settingsGroups.filter((group) => sections.some((section) => section.group === group)).map((group) => <div className="settings-navigation-group" key={group}><p>{group}</p>{sections.filter((section) => section.group === group).map(({ slug, title, icon: Icon }) => <NavLink key={slug} to={settingsSectionPath(slug)}><Icon size={16} /><span>{title}</span></NavLink>)}</div>)}</nav>
    <div className="settings-main"><Outlet /></div>
  </div></div>
}
