import { NavLink, Outlet } from 'react-router'
import { LayoutGrid } from 'lucide-react'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { settingsGroups, settingsSections, settingsSectionPath } from '../navigation'
export function SettingsLayout() {
  return <div className="settings-page"><HPageHeader title="Paramètres" description="Configurez votre organisation, vos référentiels et vos modules." /><div className="settings-shell">
    <nav className="settings-navigation" aria-label="Navigation des paramètres"><NavLink to="/settings" end><LayoutGrid size={16} /><span>Vue d’ensemble</span></NavLink>{settingsGroups.map((group) => <div className="settings-navigation-group" key={group}><p>{group}</p>{settingsSections.filter((section) => section.group === group).map(({ slug, title, icon: Icon }) => <NavLink key={slug} to={settingsSectionPath(slug)}><Icon size={16} /><span>{title}</span></NavLink>)}</div>)}</nav>
    <div className="settings-main"><Outlet /></div>
  </div></div>
}
