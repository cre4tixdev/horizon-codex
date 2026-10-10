import { RecordEditors } from './RecordEditors'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { SidebarItem } from './SidebarItem'
import { Building2, PanelLeftClose, PanelLeftOpen, CircleHelp, Keyboard } from 'lucide-react'
import { navigationGroups, navigationItems } from '../navigation'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { WorkspaceSearch } from './WorkspaceSearch'
import { HorizonMark } from '../../shared/branding/HorizonMark'
import { HBreadcrumb } from '../../shared/ui/HBreadcrumb'
import { BreadcrumbActionsContext } from '../../shared/ui/breadcrumbActionsContext'
import { HButton } from '../../shared/ui/HButton'
import { HDialog } from '../../shared/ui/HDialog'
import { isLayoutPreview, sessionService } from '../../core/auth/services/session'
import { AuthError } from '../../core/auth/services/AuthError'
import { canAccessNavigation } from '../navigationAccess'

export function AppFrame() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const [workflowActions, setWorkflowActions] = useState<HTMLDivElement | null>(null)
  const [recordActions, setRecordActions] = useState<HTMLDivElement | null>(null)
  const [breadcrumbActions, setBreadcrumbActions] = useState<HTMLDivElement | null>(null)
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<HTMLDivElement | null>(null)
  const [breadcrumbRelated, setBreadcrumbRelated] = useState<HTMLDivElement | null>(null)
  const [connectionError, setConnectionError] = useState<string>()
  useEffect(() => {
    if (isLayoutPreview) return
    async function refresh() {
      if (document.visibilityState !== 'visible') return
      try { await sessionService.refresh(); setConnectionError(undefined) }
      catch (error) { setConnectionError(error instanceof AuthError ? error.message : 'La session n’a pas pu être vérifiée.') }
    }
    const interval = window.setInterval(() => { void refresh() }, 30_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [])
  const [collapsed, setCollapsed] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { pathname } = useLocation()
  const currentItem = navigationItems.find((item) => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href + '/')))
  const currentTitle = pathname === '/account' ? 'Mon compte' : currentItem?.label ?? 'Page introuvable'

  return (
    <RecordEditors><div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      <aside className="sidebar" aria-label="Navigation Horizon">
        <Link to="/" aria-label="Horizon — Accueil" className="sidebar-brand"><HorizonMark /><span>HORIZON</span></Link>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navigationGroups.filter((group) => group.items.some((item) => canAccessNavigation(item.href, user))).map((group) => (
            <div className="sidebar-group" key={group.label}>
              <p className="sidebar-group__title">{group.label}</p>
              {group.items.filter((item) => canAccessNavigation(item.href, user)).map((item) => <SidebarItem key={item.href} item={item} />)}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-company"><Building2 size={18} aria-hidden="true" /><span><strong>CVS Engineering</strong><small>Espace interne</small></span></div>
          <HDialog open={helpOpen} onOpenChange={setHelpOpen} title="Bienvenue dans Horizon" description="Vos repères pour naviguer dans votre espace de travail."
            trigger={<HButton variant="ghost" className="sidebar-help" aria-label="Aide et raccourcis"><CircleHelp size={17} /><span>Aide & raccourcis</span></HButton>}>
            <div className="help-content"><Keyboard size={25} aria-hidden="true" /><div><h3>Accédez à un espace en un instant</h3><p>Utilisez ⌘ K sur Mac ou Ctrl K sur Windows et Linux pour rechercher dans la liste Contacts ou accéder aux espaces depuis les autres pages.</p></div></div>
            <p className="help-note">La sidebar donne accès aux domaines de votre activité. Les espaces signalés « À venir » seront disponibles progressivement.</p>
          </HDialog>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <HButton variant="ghost" size="icon" className="sidebar-toggle" aria-label={collapsed ? 'Développer la navigation' : 'Réduire la navigation'} aria-expanded={!collapsed} onClick={() => setCollapsed((current) => !current)}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </HButton>
          <WorkspaceSearch key={pathname} />
          <div className="topbar-context"><ThemeToggle /><NotificationBell /><UserMenu /></div>
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          {connectionError && <p role="alert" className="login-notice">{connectionError}</p>}
          <div className="page-breadcrumb-row"><div className="page-breadcrumb-leading"><div className="page-breadcrumb-trail"><HBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: currentTitle }]} /><div ref={setBreadcrumbTrail} className="page-breadcrumb-custom" /></div><div ref={setWorkflowActions} className="page-breadcrumb-workflow-actions page-breadcrumb-record-actions" /></div><div ref={setBreadcrumbRelated} className="page-breadcrumb-related" /><div className="page-breadcrumb-controls"><div ref={setRecordActions} className="page-breadcrumb-record-actions" /><div ref={setBreadcrumbActions} className="page-breadcrumb-actions" /></div></div>
          <BreadcrumbActionsContext.Provider value={{ actions: recordActions, workflow: workflowActions, navigation: breadcrumbActions, related: breadcrumbRelated, trail: breadcrumbTrail }}><Outlet /></BreadcrumbActionsContext.Provider>
        </main>
      </div>
    </div></RecordEditors>
  )
}
