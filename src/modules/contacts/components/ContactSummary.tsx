import { useQuery } from '@tanstack/react-query'
import { Building2, UsersRound, Handshake, Truck } from 'lucide-react'
import { contactsService } from '../services/ContactsService'
import { HButton } from '../../../shared/ui/HButton'

export function ContactSummary() {
  const summary = useQuery({ queryKey: ['contacts', 'summary'], queryFn: () => contactsService.summary(), retry: false })
  const metrics = [{ key: 'people', label: 'Contacts', icon: UsersRound, tone: 'pink' }, { key: 'companies', label: 'Sociétés', icon: Building2, tone: 'violet' }, { key: 'customers', label: 'Clients', icon: Handshake, tone: 'blue' }, { key: 'suppliers', label: 'Fournisseurs', icon: Truck, tone: 'orange' }] as const
  return <section className="contact-summary" aria-label="Synthèse du répertoire">
    {metrics.map(({ key, label, icon: Icon, tone }) => <div key={key} className={`contact-summary-card contact-summary-card--${tone}`} role="group" aria-label={`${label} actifs`}><span className="contact-summary-icon"><Icon size={20} /></span><div><strong>{summary.data ? new Intl.NumberFormat('fr-FR').format(summary.data[key]) : '—'}</strong><span>{label}</span></div><small>Actifs</small></div>)}
    {summary.error && <div className="contact-summary-error" role="alert">Synthèse indisponible.<HButton size="small" onClick={() => { void summary.refetch() }}>Réessayer</HButton></div>}
  </section>
}
