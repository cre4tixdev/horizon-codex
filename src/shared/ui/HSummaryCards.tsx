import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { HButton } from './HButton'

const tones = { violet: 'customers', amber: 'suppliers', blue: 'companies', rose: 'people', green: 'green' }
export function HSummaryCards({ label, items, error, onRetry }: { label: string; items: { label: string; href: string; icon: LucideIcon; tone: keyof typeof tones; count: number | undefined; detail: string; accessibleLabel?: string }[]; error: string | undefined; onRetry: () => void }) {
  return <section className="contact-summary" aria-label={label}>
    {items.map(({ label, href, icon: Icon, tone, count, detail, accessibleLabel }) => <Link key={label} to={href} className={`contact-summary-card contact-summary-card--${tones[tone]}`} aria-label={accessibleLabel || label}><span className="contact-summary-icon"><Icon size={20} /></span><div><strong>{count === undefined ? '—' : new Intl.NumberFormat('fr-FR').format(count)}</strong><span>{label}</span></div><small>{detail}</small></Link>)}
    {error && <div className="contact-summary-error" role="alert">{error}<HButton size="small" onClick={onRetry}>Réessayer</HButton></div>}
  </section>
}
