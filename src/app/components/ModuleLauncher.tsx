import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import type { NavigationGroup } from '../navigation'
import { HorizonMark } from '../../shared/branding/HorizonMark'
import { HDialog } from '../../shared/ui/HDialog'

export function ModuleLauncher({ groups }: { groups: NavigationGroup[] }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  return <HDialog open={open} onOpenChange={setOpen} title="Modules Horizon" description="Accédez à votre espace de travail." className="module-launcher-dialog" overlayClassName="module-launcher-overlay" trigger={<button type="button" className="sidebar-brand" aria-label="Ouvrir les modules Horizon" title="Modules Horizon"><HorizonMark /><span>HORIZON</span></button>}>
    <nav className="module-launcher" aria-label="Menu des modules">{groups.map((group) => <section key={group.label} className="module-launcher-group" aria-label={group.label}>
      <h2>{group.label}</h2><div className="module-launcher-grid">{group.items.map((item) => {
        const Icon = item.icon
        const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return <div className="module-launcher-item" key={item.href} data-active={active}>
          <Link className="module-launcher-link" to={item.href} title={item.description} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={38} strokeWidth={1.35} aria-hidden="true" /><span>{item.label}</span></Link>
        </div>
      })}</div>
    </section>)}</nav>
  </HDialog>
}
