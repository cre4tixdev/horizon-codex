import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function HEmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon size={21} aria-hidden="true" /></span>
      <h3>{title}</h3><p>{description}</p>
      {children && <div className="empty-state__action">{children}</div>}
    </div>
  )
}
