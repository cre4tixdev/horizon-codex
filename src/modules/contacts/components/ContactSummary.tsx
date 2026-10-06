import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { Building2, UsersRound, Handshake, Truck } from 'lucide-react'
import { contactsService } from '../services/ContactsService'
import { HButton } from '../../../shared/ui/HButton'

export function ContactSummary() {
  const [params] = useSearchParams()
  const view = params.get('view') === 'list' ? 'list' : 'cards'
  const summary = useQuery({ queryKey: ['contacts', 'summary'], queryFn: () => contactsService.summary(), retry: false })
  const metrics = [{ key: 'customers', label: 'Clients', icon: Handshake, tone: 'blue' }, { key: 'suppliers', label: 'Fournisseurs', icon: Truck, tone: 'orange' }, { key: 'companies', label: 'Sociétés', icon: Building2, tone: 'violet' }, { key: 'people', label: 'Personnes', icon: UsersRound, tone: 'pink' }] as const
  return <section className="contact-summary" aria-label="Synthèse du répertoire">
    {metrics.map(({ key, label, icon: Icon, tone }) => <Link key={key} to={`${key === 'people' ? '/contacts/people' : '/contacts'}?view=${view}${key === 'customers' ? '&role=customer' : key === 'suppliers' ? '&role=supplier' : ''}`} className={`contact-summary-card contact-summary-card--${tone}`} aria-label={`${label} actifs`}><span className="contact-summary-icon"><Icon size={20} /></span><div><strong>{summary.data ? new Intl.NumberFormat('fr-FR').format(summary.data[key]) : '—'}</strong><span>{label}</span></div><small>Actifs</small></Link>)}
    {summary.error && <div className="contact-summary-error" role="alert">Synthèse indisponible.<HButton size="small" onClick={() => { void summary.refetch() }}>Réessayer</HButton></div>}
  </section>
}
