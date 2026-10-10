import { useId, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { NavigationItem } from '../navigation'

export function SidebarItem({ item }: { item: NavigationItem }) {
  const { pathname, search } = useLocation()
  const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)
  const [expanded, setExpanded] = useState(active)
  const id = useId()
  const Icon = item.icon
  const link = <NavLink to={item.href} end={item.href === '/'} aria-label={item.label} title={item.label} className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}><Icon size={17} aria-hidden="true" /><span>{item.label}</span></NavLink>
  if (!item.children?.length) return link
  const queryKeys = new Set(item.children.flatMap((child) => [...new URLSearchParams(child.href.split('?')[1]).keys()].filter((key) => key !== 'view')))
  return <div className="sidebar-entry">
    <div className="sidebar-entry-row">{link}<button type="button" className="sidebar-submenu-toggle" aria-label={`${expanded ? 'Replier' : 'Déplier'} ${item.label}`} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}><ChevronRight size={14} aria-hidden="true" /></button></div>
    <div id={id} className="sidebar-submenu" hidden={!expanded}>{item.children.map((child) => {
      const [path, query = ''] = child.href.split('?')
      const expected = new URLSearchParams(query)
      const current = new URLSearchParams(search)
      const selected = pathname === path && [...queryKeys].every((key) => current.get(key) === expected.get(key))
      const ChildIcon = child.icon
      return <Link key={child.href} to={child.href} className={`sidebar-link sidebar-submenu-link${selected ? ' sidebar-submenu-link--active' : ''}`} aria-current={selected ? 'page' : undefined} title={child.label}><ChildIcon size={14} aria-hidden="true" /><span>{child.label}</span></Link>
    })}</div>
  </div>
}
