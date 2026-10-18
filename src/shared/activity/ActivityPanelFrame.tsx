import type { ReactNode } from 'react'
import { History } from 'lucide-react'

export function ActivityPanelFrame({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  return <section className={`activity-panel ${className}`.trim()} id={id} aria-label="Fil d’activité">
    <div className="activity-panel-heading"><div className="activity-panel-title"><span className="activity-heading-icon"><History size={18} /></span><div><h2>Fil d’activité</h2><p>Les échanges et l’histoire de cette fiche.</p></div></div></div>
    {children}
  </section>
}
