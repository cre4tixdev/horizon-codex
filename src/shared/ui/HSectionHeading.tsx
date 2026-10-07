import { HFieldLabel } from './HFieldLabel'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function HSectionHeading({ title, titleFor, required = false, count, description, icon: Icon, actions }: { title: string; titleFor?: string; required?: boolean; count?: number | undefined; description?: string; icon?: LucideIcon; actions?: ReactNode }) {
  return <div className="h-section-heading">
    <div className="h-section-heading-content">
      <div className="h-section-heading-title">{Icon && <Icon size={14} aria-hidden="true" />}<h2>{titleFor ? <label htmlFor={titleFor}><HFieldLabel required={required}>{title}</HFieldLabel></label> : title}{count !== undefined && <> <small>({count})</small></>}</h2></div>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="h-section-heading-actions">{actions}</div>}
  </div>
}
